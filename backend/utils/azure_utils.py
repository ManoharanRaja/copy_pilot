from azure.storage.filedatalake import DataLakeServiceClient
from azure.core.exceptions import AzureError
import concurrent.futures
import socket

def get_adl_service_client(account_name, account_key, timeout=20):
    """
    Returns an authenticated DataLakeServiceClient for the given account.
    Tries to connect and raises an exception if authentication fails or if it times out.
    :param account_name: Azure storage account name
    :param account_key: Azure storage account key
    :param timeout: Timeout in seconds for authentication
    """
    def connect():
        # Attempt to create the client and list file systems to force authentication
        client = DataLakeServiceClient(
            account_url=f"https://{account_name}.dfs.core.windows.net",
            credential=account_key
        )
        # This call will fail fast if the account does not exist or credentials are invalid
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