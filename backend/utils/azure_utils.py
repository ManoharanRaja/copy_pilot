from azure.storage.filedatalake import DataLakeServiceClient
from azure.core.exceptions import AzureError
import concurrent.futures
import socket

def get_adl_service_client(account_name, account_key=None, sas_token=None, container=None, timeout=10):
    """
    Returns an authenticated DataLakeServiceClient for the given account.
    Uses either account_key or sas_token for authentication.
    Tries to connect and raises an exception if authentication fails or if it times out.
    :param account_name: Azure storage account name
    :param account_key: Azure storage account key (optional)
    :param sas_token: Azure SAS token (optional)
    :param timeout: Timeout in seconds for authentication
    """
    def connect():
        # Ensure SAS token starts with '?'
        credential = None
        if sas_token:
            credential = sas_token if sas_token.startswith("?") else "?" + sas_token
        elif account_key:
            credential = account_key
        if not credential:
            raise Exception("Either account_key or sas_token must be provided.")
        
        client = DataLakeServiceClient(
            account_url=f"https://{account_name}.dfs.core.windows.net",
            credential=credential
        )
        
        # Validate connection by listing file systems or paths
        if container:
            fs_client = client.get_file_system_client(container)
            # Try listing paths in the container root to validate access
            list(fs_client.get_paths())
        else:
            # Try listing file systems to validate account-level access
            list(client.list_file_systems())
        return client
    
    try:
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(connect)
            return future.result(timeout=timeout)
    except concurrent.futures.TimeoutError:
        raise Exception(f"Azure authentication timed out after {timeout} seconds")
    except AzureError as ae:
        raise Exception(f"Azure authentication failed: {ae}")
    except Exception as e:
        raise Exception(f"Azure connection error: {e}")

def test_adls_connection(account_name, account_key=None, container=None, timeout=10, sas_token=None):
    """
    Tests connection to Azure Data Lake Storage.
    Uses either account_key or sas_token for authentication.
    If container is provided, checks access to the container and lists folders.
    If not, just checks account connectivity.
    Returns (success: bool, message: str)
    """
    try:
        client = get_adl_service_client(account_name, account_key, sas_token=sas_token, container=container, timeout=timeout)
        if container:
            fs_client = client.get_file_system_client(container)
            # Try listing paths to verify access to the container
            paths = list(fs_client.get_paths())
            folder_names = [p.name for p in paths if p.is_directory]
            return True, f"Connection successful. Folders: {folder_names or 'No folders found.'}"
        else:
            # Just try listing file systems to check account connectivity
            _ = list(client.list_file_systems())
            return True, "Connection to account successful."
    except AzureError as ae:
        return False, f"Azure error: {ae}"
    except Exception as e:
        return False, f"Connection failed: {e}"