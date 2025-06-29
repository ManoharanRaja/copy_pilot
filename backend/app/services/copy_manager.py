import os
import fnmatch
import shutil
from azure.core.exceptions import AzureError
from backend.utils.azure_utils import get_adl_service_client
from backend.utils.crypto import decrypt
from backend.config.settings import ENCRYPTION_KEY
from backend.storage.data_source_storage import load_data_source_by_id

def get_azure_config_by_id(azure_id):
    ds = load_data_source_by_id(azure_id)
    if not ds:
        raise ValueError(f"Azure Data Source with id {azure_id} not found")
    config = ds["config"]
    config["account_key"] = decrypt(config["account_key"], ENCRYPTION_KEY)
    return config

def copy_local_to_local(source, target, file_mask, _=None):
    try:
        if not os.path.exists(source):
            raise FileNotFoundError(f"Source folder '{source}' does not exist.")
        if not os.path.exists(target):
            os.makedirs(target)
        all_files = [f for f in os.listdir(source) if os.path.isfile(os.path.join(source, f))]
        source_files = [os.path.join(source, f) for f in fnmatch.filter(all_files, file_mask)]
        if not source_files:
            raise Exception(f"No files matching '{file_mask}' found in folder '{source}'.")
        copied_files = []
        for src_file in source_files:
            filename = os.path.basename(src_file)
            dst_file = os.path.join(target, filename)
            if not os.path.exists(src_file):
                raise FileNotFoundError(f"File '{src_file}' does not exist in source folder '{source}'.")
            shutil.copy2(src_file, dst_file)
            copied_files.append(dst_file)
        return copied_files, source_files
    except FileNotFoundError as fnf:
        raise FileNotFoundError(str(fnf))
    except Exception as e:
        raise Exception(str(e))

def copy_local_to_azure(source, target, file_mask, azure_config):
    """
    Uploads files from a local folder to Azure Data Lake Storage.
    source: local folder path
    target: dict with keys 'filesystem' and 'directory'
    file_mask: e.g. '*.csv'
    azure_config: dict with 'account_name' and 'account_key'
    """
    try:
        account_name = azure_config["account_name"]
        account_key = azure_config["account_key"]
        filesystem = target.get("filesystem")
        directory = target.get("directory", "")

        # Connect to Azure Data Lake
        service_client = get_adl_service_client(account_name, account_key)
        file_system_client = service_client.get_file_system_client(filesystem)
        dir_client = file_system_client.get_directory_client(directory)

        # List local files matching the mask
        if not os.path.exists(source):
            raise FileNotFoundError(f"Source folder '{source}' does not exist.")
        all_files = [f for f in os.listdir(source) if os.path.isfile(os.path.join(source, f))]
        source_files = [os.path.join(source, f) for f in fnmatch.filter(all_files, file_mask)]
        if not source_files:
            raise Exception(f"No files matching '{file_mask}' found in folder '{source}'.")
        copied_files = []
        for src_file in source_files:
            filename = os.path.basename(src_file)
            azure_path = f"{directory}/{filename}" if directory else filename
            if not os.path.exists(src_file):
                raise FileNotFoundError(f"File '{src_file}' does not exist in source folder '{source}'.")
            file_client = file_system_client.get_file_client(azure_path)
            with open(src_file, "rb") as data:
                file_client.upload_data(data, overwrite=True)
            copied_files.append(f"https://{account_name}.blob.core.windows.net/{filesystem}/{azure_path}")

        return copied_files, source_files
    except FileNotFoundError as fnf:
        raise FileNotFoundError(str(fnf))
    except AzureError as ae:
        raise Exception(f"Local to Azure copy failed (AzureError): {ae}")
    except Exception as e:
        raise Exception(str(e))

def copy_azure_to_local(source, target, file_mask, azure_config):
    try:
        account_name = azure_config["account_name"]
        account_key = azure_config["account_key"]
        filesystem = source.get("filesystem")
        directory = source.get("directory", "")
        service_client = get_adl_service_client(account_name, account_key)
        file_system_client = service_client.get_file_system_client(filesystem)
        dir_client = file_system_client.get_directory_client(directory)
        paths = dir_client.get_paths()
        source_files = []
        for path in paths:
            if not path.is_directory:
                filename = os.path.basename(path.name)
                if fnmatch.fnmatch(filename, file_mask):
                    source_files.append(path.name)
        if not os.path.exists(target):
            os.makedirs(target)
        if not source_files:
            raise Exception(f"No files matching '{file_mask}' found in Azure directory '{directory}'.")
        copied_files = []
        for file_path in source_files:
            file_client = file_system_client.get_file_client(file_path)
            download = file_client.download_file()
            file_content = download.readall()
            local_filename = os.path.join(target, os.path.basename(file_path))
            with open(local_filename, "wb") as f:
                f.write(file_content)
            copied_files.append(local_filename)
        return copied_files, [f"https://{account_name}.blob.core.windows.net/{filesystem}/{f}" for f in source_files]
    except FileNotFoundError as fnf:
        raise FileNotFoundError(str(fnf))
    except AzureError as ae:
        raise Exception(f"Azure to Local copy failed (AzureError): {ae}")
    except Exception as e:
        raise Exception(str(e))

def copy_azure_to_azure(source, target, file_mask, configs):
    """
    Copy files from Azure Data Lake (possibly different accounts) to Azure Data Lake.
    source: dict with 'filesystem', 'directory', 'account_name', 'account_key' (optional)
    target: dict with 'filesystem', 'directory', 'account_name', 'account_key' (optional)
    configs: dict with 'source_azure' and 'target_azure' configs (each with account_name/key)
    """
    try:
        # Use configs if provided, else fall back to source/target dicts
        src_account_name = configs.get("source_azure", {}).get("account_name") or source.get("account_name")
        src_account_key = configs.get("source_azure", {}).get("account_key") or source.get("account_key")
        tgt_account_name = configs.get("target_azure", {}).get("account_name") or target.get("account_name")
        tgt_account_key = configs.get("target_azure", {}).get("account_key") or target.get("account_key")

        src_filesystem = source.get("filesystem")
        src_directory = source.get("directory", "")
        tgt_filesystem = target.get("filesystem")
        tgt_directory = target.get("directory", "")

        # Source client
        src_service_client = get_adl_service_client(src_account_name, src_account_key)
        src_fs_client = src_service_client.get_file_system_client(src_filesystem)
        src_dir_client = src_fs_client.get_directory_client(src_directory)

        # Target client (may be different account)
        tgt_service_client = get_adl_service_client(tgt_account_name, tgt_account_key)
        tgt_fs_client = tgt_service_client.get_file_system_client(tgt_filesystem)

        # List source files
        paths = src_dir_client.get_paths()
        source_files = []
        for path in paths:
            if not path.is_directory:
                filename = os.path.basename(path.name)
                if fnmatch.fnmatch(filename, file_mask):
                    source_files.append(path.name)
        if not source_files:
            raise Exception(f"No files matching '{file_mask}' found in Azure directory '{src_directory}'.")
        copied_files = []
        for file_path in source_files:
            src_file_client = src_fs_client.get_file_client(file_path)
            download = src_file_client.download_file()
            file_content = download.readall()
            filename = os.path.basename(file_path)
            tgt_path = f"{tgt_directory}/{filename}" if tgt_directory else filename
            tgt_file_client = tgt_fs_client.get_file_client(tgt_path)
            tgt_file_client.upload_data(file_content, overwrite=True)
            copied_files.append(f"https://{tgt_account_name}.blob.core.windows.net/{tgt_filesystem}/{tgt_path}")

        return copied_files, [f"https://{src_account_name}.blob.core.windows.net/{src_filesystem}/{f}" for f in source_files]
    except AzureError as ae:
        raise Exception(f"Azure to Azure copy failed (AzureError): {ae}")
    except Exception as e:
        raise Exception(str(e))
    
def copy_smb_to_smb(source, target, file_mask, smb_config=None):
    try:
        if not os.path.exists(source):
            raise FileNotFoundError(f"Source SMB folder '{source}' does not exist.")
        if not os.path.exists(target):
            os.makedirs(target)
        all_files = [f for f in os.listdir(source) if os.path.isfile(os.path.join(source, f))]
        source_files = [os.path.join(source, f) for f in fnmatch.filter(all_files, file_mask)]
        if not source_files:
            raise Exception(f"No files matching '{file_mask}' found in SMB folder '{source}'.")
        copied_files = []
        for src_file in source_files:
            filename = os.path.basename(src_file)
            dst_file = os.path.join(target, filename)
            if not os.path.exists(src_file):
                raise FileNotFoundError(f"File '{src_file}' does not exist in source SMB folder '{source}'.")
            shutil.copy2(src_file, dst_file)
            copied_files.append(dst_file)
        return copied_files, source_files
    except FileNotFoundError as fnf:
        raise FileNotFoundError(str(fnf))
    except Exception as e:
        raise Exception(str(e))

def copy_local_to_smb(source, target, file_mask, smb_config=None):
    # Same as local to local, just target is a share path
    return copy_local_to_local(source, target, file_mask)

def copy_smb_to_local(source, target, file_mask, smb_config=None):
    # Same as local to local, just source is a share path
    return copy_local_to_local(source, target, file_mask)

def copy_smb_to_azure(source, target, file_mask, azure_config):
    # Same as local to azure, just source is a share path
    return copy_local_to_azure(source, target, file_mask, azure_config)

def copy_azure_to_smb(source, target, file_mask, azure_config):
    # Same as azure to local, just target is a share path
    return copy_azure_to_local(source, target, file_mask, azure_config)

COPY_FUNCTIONS = {
    ("local", "local"): copy_local_to_local,
    ("local", "azure"): copy_local_to_azure,
    ("local", "smb"): copy_local_to_smb,
    ("azure", "local"): copy_azure_to_local,
    ("azure", "azure"): copy_azure_to_azure,
    ("azure", "smb"): copy_azure_to_smb,
    ("smb", "local"): copy_smb_to_local,
    ("smb", "azure"): copy_smb_to_azure,
    ("smb", "smb"): copy_smb_to_smb,
}

def dispatch_copy(job):
    source_type = job.get("sourceType")
    target_type = job.get("targetType")
    source = job.get("source")
    target = job.get("target")
    file_mask = job.get("sourceFileMask", "*")
    configs = {}

    if source_type == "azure":
        azure_id = job.get("sourceAzureId")
        configs["source_azure"] = get_azure_config_by_id(azure_id)
        source = {
            "filesystem": job.get("sourceContainer"),
            "directory": source
        }
    if target_type == "azure":
        azure_id = job.get("targetAzureId")
        configs["target_azure"] = get_azure_config_by_id(azure_id)
        target = {
            "filesystem": job.get("targetContainer"),
            "directory": target
        }

    func = COPY_FUNCTIONS.get((source_type, target_type))
    if not func:
        raise NotImplementedError(f"Copy from {source_type} to {target_type} not implemented")
    if (source_type, target_type) == ("azure", "azure"):
        return func(source, target, file_mask, configs)
    elif source_type == "azure":
        return func(source, target, file_mask, configs.get("source_azure"))
    elif target_type == "azure":
        return func(source, target, file_mask, configs.get("target_azure"))
    else:
        return func(source, target, file_mask)