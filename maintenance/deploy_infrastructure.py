"""
AZURE INFRASTRUCTURE PROVISIONER - JurisLink
Automates the creation of Azure resources for production deployment.

Usage:
    python maintenance/deploy_infrastructure.py

Prerequisites:
    - Azure CLI installed (az)
    - Logged into Azure (az login)
    - GitHub Personal Access Token for SWA deployment
"""
import subprocess
import random
import string
import json
import sys
import os
from pathlib import Path

# =============================================================================
# CONFIGURATION
# =============================================================================
CONFIG = {
    "resource_group": "JurisLink-RG",
    "location": "eastus2",
    "app_prefix": "jurislink",
    "python_version": "3.10",
    "github_repo": "potlurisravanth-png/JurisLink_Portfolio",  # Public repo for SWA
    "github_branch": "main",
}

# =============================================================================
# AZURE CLI WRAPPER
# =============================================================================
def run_az(command: str, parse_json: bool = True) -> dict | str:
    """Execute Azure CLI command and return result."""
    full_cmd = f"az {command}"
    if parse_json:
        full_cmd += " --output json"
    
    print(f"  → az {command[:60]}{'...' if len(command) > 60 else ''}")
    
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
        return json.loads(result.stdout)
    return result.stdout.strip()


def check_azure_login() -> bool:
    """Verify user is logged into Azure."""
    try:
        account = run_az("account show")
        print(f"  ✅ Logged in as: {account.get('user', {}).get('name', 'Unknown')}")
        print(f"  📍 Subscription: {account.get('name', 'Unknown')}")
        return True
    except Exception:
        return False


def generate_unique_suffix(length: int = 4) -> str:
    """Generate random alphanumeric suffix for globally unique names."""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


# =============================================================================
# RESOURCE CREATION
# =============================================================================
def create_resource_group(name: str, location: str) -> dict:
    """Create Azure Resource Group."""
    print("\n📁 Creating Resource Group...")
    return run_az(f'group create --name {name} --location {location}')


def create_storage_account(name: str, rg: str, location: str) -> dict:
    """Create Storage Account (required for Functions)."""
    print("\n💾 Creating Storage Account...")
    # Storage account names must be lowercase, 3-24 chars, alphanumeric only
    storage_name = f"{name.replace('-', '')}storage"[:24]
    return run_az(
        f'storage account create '
        f'--name {storage_name} '
        f'--resource-group {rg} '
        f'--location {location} '
        f'--sku Standard_LRS '
        f'--kind StorageV2'
    )


def create_function_app(name: str, rg: str, location: str, storage: str, python_version: str) -> dict:
    """Create Azure Function App (Consumption Plan)."""
    print("\n⚡ Creating Function App...")
    func_name = f"{name}-api"
    
    # Create consumption plan
    run_az(
        f'functionapp plan create '
        f'--name {func_name}-plan '
        f'--resource-group {rg} '
        f'--location {location} '
        f'--sku Y1 '  # Consumption plan
        f'--is-linux'
    )
    
    # Create function app
    storage_name = f"{name.replace('-', '')}storage"[:24]
    return run_az(
        f'functionapp create '
        f'--name {func_name} '
        f'--resource-group {rg} '
        f'--storage-account {storage_name} '
        f'--plan {func_name}-plan '
        f'--runtime python '
        f'--runtime-version {python_version} '
        f'--functions-version 4 '
        f'--os-type Linux'
    )


def create_static_web_app(name: str, rg: str, location: str, github_repo: str, branch: str) -> dict:
    """Create Azure Static Web App."""
    print("\n🌐 Creating Static Web App...")
    swa_name = f"{name}-web"
    
    return run_az(
        f'staticwebapp create '
        f'--name {swa_name} '
        f'--resource-group {rg} '
        f'--location {location} '
        f'--source https://github.com/{github_repo} '
        f'--branch {branch} '
        f'--app-location "/frontend_portal" '
        f'--output-location "dist" '
        f'--login-with-github'
    )


def get_function_url(func_name: str, rg: str) -> str:
    """Get the Function App hostname."""
    result = run_az(f'functionapp show --name {func_name} --resource-group {rg}')
    return f"https://{result.get('defaultHostName', '')}"


def get_swa_deployment_token(swa_name: str, rg: str) -> str:
    """Get SWA deployment token for GitHub Actions."""
    result = run_az(
        f'staticwebapp secrets list --name {swa_name} --resource-group {rg}'
    )
    return result.get('properties', {}).get('apiKey', 'TOKEN_NOT_FOUND')


def configure_function_app_settings(func_name: str, rg: str, settings: dict) -> None:
    """Set environment variables on Function App."""
    print("\n⚙️ Configuring Function App Settings...")
    settings_str = ' '.join([f'{k}="{v}"' for k, v in settings.items()])
    run_az(
        f'functionapp config appsettings set '
        f'--name {func_name} '
        f'--resource-group {rg} '
        f'--settings {settings_str}',
        parse_json=False
    )


# =============================================================================
# MAIN DEPLOYMENT FLOW
# =============================================================================
def main():
    print("=" * 60)
    print("  JURISLINK - AZURE INFRASTRUCTURE PROVISIONER")
    print("=" * 60)
    
    # 1. Check Azure Login
    print("\n🔐 Checking Azure Login...")
    if not check_azure_login():
        print("  ❌ Not logged into Azure. Run: az login")
        sys.exit(1)
    
    # 2. Generate unique names
    suffix = generate_unique_suffix()
    app_name = f"{CONFIG['app_prefix']}-{suffix}"
    print(f"\n🎲 Generated unique name: {app_name}")
    
    # 3. Create Resource Group
    create_resource_group(CONFIG['resource_group'], CONFIG['location'])
    
    # 4. Create Storage Account
    create_storage_account(app_name, CONFIG['resource_group'], CONFIG['location'])
    
    # 5. Create Function App
    func_result = create_function_app(
        app_name,
        CONFIG['resource_group'],
        CONFIG['location'],
        f"{app_name.replace('-', '')}storage"[:24],
        CONFIG['python_version']
    )
    func_name = f"{app_name}-api"
    
    # 6. Configure Function App (add API keys)
    print("\n📝 Note: You need to manually add these secrets to your Function App:")
    print("    - OPENAI_API_KEY")
    print("    - TAVILY_API_KEY")
    
    # 7. Create Static Web App (optional - requires GitHub auth)
    print("\n🌐 Static Web App Creation...")
    print("    Run this command manually to link to GitHub:")
    print(f"    az staticwebapp create --name {app_name}-web \\")
    print(f"        --resource-group {CONFIG['resource_group']} \\")
    print(f"        --source https://github.com/{CONFIG['github_repo']} \\")
    print(f"        --branch {CONFIG['github_branch']} \\")
    print(f"        --app-location '/frontend_portal' \\")
    print(f"        --output-location 'dist' \\")
    print(f"        --login-with-github")
    
    # 8. Get URLs
    print("\n" + "=" * 60)
    print("  📋 DEPLOYMENT SUMMARY")
    print("=" * 60)
    
    try:
        func_url = get_function_url(func_name, CONFIG['resource_group'])
        print(f"\n  🔗 Function App URL: {func_url}")
    except Exception:
        print(f"\n  🔗 Function App URL: https://{func_name}.azurewebsites.net")
    
    print(f"  📁 Resource Group: {CONFIG['resource_group']}")
    print(f"  📍 Location: {CONFIG['location']}")
    print(f"  🎯 App Name Prefix: {app_name}")
    
    print("\n" + "-" * 60)
    print("  📌 NEXT STEPS:")
    print("-" * 60)
    print("""
  1. Deploy Function App code:
     cd D:\\JurisLink_Solution
     func azure functionapp publish {func_name}

  2. Add secrets to Function App (Azure Portal):
     - OPENAI_API_KEY
     - TAVILY_API_KEY

  3. Update frontend_portal API URL:
     Edit frontend_portal/.env:
     VITE_API_URL=https://{func_name}.azurewebsites.net/api

  4. Deploy Static Web App via GitHub Actions or:
     cd frontend_portal && npm run build
     az staticwebapp deploy --app-name {app_name}-web
""".format(func_name=func_name, app_name=app_name))
    
    print("=" * 60)
    print("  ✅ Infrastructure provisioning complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
