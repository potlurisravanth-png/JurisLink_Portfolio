"""
AZURE STATIC WEB APP DEPLOYER - JurisLink Frontend
Automates deployment of the React frontend to Azure Static Web Apps.

Usage:
    python maintenance/deploy_frontend.py

Prerequisites:
    - Azure CLI installed (az)
    - Logged into Azure (az login)
    - Backend already deployed (e.g., jurislink-api.azurewebsites.net)
"""
import subprocess
import sys
import json

# =============================================================================
# CONFIGURATION
# =============================================================================
DEFAULT_CONFIG = {
    "resource_group": "JurisLink-RG",
    "location": "eastus2",
    "swa_name": "jurislink-frontend",
    "app_location": "frontend_portal",
    "output_location": "dist",
    "github_repo": "potlurisravanth-png/JurisLink_Source",
    "branch": "main",
}


# =============================================================================
# AZURE CLI WRAPPER
# =============================================================================
def run_az(command: str, parse_json: bool = True) -> dict | str:
    """Execute Azure CLI command and return result."""
    full_cmd = f"az {command}"
    if parse_json:
        full_cmd += " --output json"
    
    print(f"  → az {command[:70]}{'...' if len(command) > 70 else ''}")
    
    result = subprocess.run(
        full_cmd,
        shell=True,
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        error_msg = result.stderr.strip()
        if "already exists" in error_msg.lower():
            print(f"    ⚠️ Resource already exists, continuing...")
            return {}
        raise Exception(f"Azure CLI Error:\n{error_msg}")
    
    if parse_json and result.stdout.strip():
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            return result.stdout.strip()
    return result.stdout.strip()


def check_azure_login() -> bool:
    """Verify user is logged into Azure."""
    try:
        account = run_az("account show")
        print(f"  ✅ Logged in as: {account.get('user', {}).get('name', 'Unknown')}")
        return True
    except Exception:
        return False


def register_provider(namespace: str) -> None:
    """Register an Azure resource provider if not already registered."""
    print(f"  📝 Registering {namespace}...")
    try:
        run_az(f'provider register --namespace {namespace}', parse_json=False)
    except Exception:
        pass  # May already be registered


# =============================================================================
# MAIN DEPLOYMENT FLOW
# =============================================================================
def main():
    print("=" * 60)
    print("  JURISLINK - STATIC WEB APP DEPLOYER")
    print("=" * 60)
    
    # 1. Check Azure Login
    print("\n🔐 Checking Azure Login...")
    if not check_azure_login():
        print("  ❌ Not logged into Azure. Run: az login")
        sys.exit(1)
    
    # 2. Get Backend URL from user
    print("\n" + "-" * 60)
    default_backend = "https://jurislink-api.azurewebsites.net/api/chat"
    backend_url = input(f"Enter Backend URL [{default_backend}]: ").strip()
    if not backend_url:
        backend_url = default_backend
    
    # 3. Get Resource Group
    rg = input(f"Enter Resource Group [{DEFAULT_CONFIG['resource_group']}]: ").strip()
    if not rg:
        rg = DEFAULT_CONFIG['resource_group']
    
    # 4. Register Web provider
    print("\n📝 Registering required providers...")
    register_provider("Microsoft.Web")
    
    # 5. Create Static Web App
    print("\n🌐 Creating Static Web App...")
    print("    Note: This will open a browser for GitHub authentication.")
    
    swa_name = DEFAULT_CONFIG['swa_name']
    
    try:
        # Try to create SWA linked to GitHub
        result = run_az(
            f'staticwebapp create '
            f'--name {swa_name} '
            f'--resource-group {rg} '
            f'--location {DEFAULT_CONFIG["location"]} '
            f'--source https://github.com/{DEFAULT_CONFIG["github_repo"]} '
            f'--branch {DEFAULT_CONFIG["branch"]} '
            f'--app-location "/{DEFAULT_CONFIG["app_location"]}" '
            f'--output-location "{DEFAULT_CONFIG["output_location"]}" '
            f'--login-with-github'
        )
    except Exception as e:
        print(f"\n⚠️ GitHub linking may require manual setup.")
        print(f"    Error: {str(e)[:100]}")
        
        # Try creating without GitHub link
        print("\n📦 Creating SWA without GitHub link (manual deploy)...")
        try:
            result = run_az(
                f'staticwebapp create '
                f'--name {swa_name} '
                f'--resource-group {rg} '
                f'--location {DEFAULT_CONFIG["location"]} '
                f'--sku Free'
            )
        except Exception as e2:
            # May already exist
            print(f"    SWA may already exist, continuing...")
    
    # 6. Configure API settings
    print("\n⚙️ Configuring Backend URL...")
    try:
        run_az(
            f'staticwebapp appsettings set '
            f'--name {swa_name} '
            f'--resource-group {rg} '
            f'--setting-names VITE_API_URL="{backend_url}"',
            parse_json=False
        )
        print(f"    ✅ Set VITE_API_URL = {backend_url}")
    except Exception as e:
        print(f"    ⚠️ Could not set app settings: {str(e)[:50]}")
    
    # 7. Get SWA details
    print("\n📊 Getting SWA details...")
    try:
        swa_info = run_az(f'staticwebapp show --name {swa_name} --resource-group {rg}')
        default_hostname = swa_info.get('defaultHostname', 'unknown')
        print(f"\n  🌍 Default Hostname: https://{default_hostname}")
    except Exception:
        default_hostname = f"{swa_name}.azurestaticapps.net"
    
    # 8. Get deployment token
    print("\n🔑 Getting Deployment Token...")
    try:
        token_info = run_az(f'staticwebapp secrets list --name {swa_name} --resource-group {rg}')
        api_key = token_info.get('properties', {}).get('apiKey', 'TOKEN_NOT_FOUND')
        print(f"    Token (first 20 chars): {api_key[:20]}...")
    except Exception:
        api_key = "Could not retrieve token"
    
    # 9. Output Summary
    print("\n" + "=" * 60)
    print("  📋 DEPLOYMENT SUMMARY")
    print("=" * 60)
    print(f"""
  🌐 Static Web App Created!
  
  📍 Public URL: https://{default_hostname}
  🔗 Backend:    {backend_url}
  
  📁 Resource Group: {rg}
  📦 SWA Name:       {swa_name}
""")
    
    print("-" * 60)
    print("  📌 NEXT STEPS:")
    print("-" * 60)
    print(f"""
  OPTION 1: Manual Deploy (Recommended for first time)
  -----------------------------------------------------
  cd frontend_portal
  npm run build
  npx @azure/static-web-apps-cli deploy ./dist \\
      --deployment-token {api_key[:30]}... \\
      --env production

  OPTION 2: Add to GitHub Secrets for CI/CD
  ------------------------------------------
  Go to: GitHub Repo → Settings → Secrets → Actions
  Add: AZURE_STATIC_WEB_APPS_API_TOKEN = {api_key[:30]}...

  Then push to {DEFAULT_CONFIG['branch']} to trigger auto-deploy.
""")
    
    print("=" * 60)
    print("  ✅ Frontend deployment setup complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
