class AdlsStorageAdapter:
    def __init__(self, account_name, account_key):
        self.account_name = account_name
        self.account_key = account_key
        self.service_client = self._initialize_service_client()

    def _initialize_service_client(self):
        from azure.storage.filedatalake import DataLakeServiceClient
        return DataLakeServiceClient(
            account_url=f"https://{self.account_name}.dfs.core.windows.net",
            credential=self.account_key
        )

    def copy_file(self, source_path, target_path):
        source_file_system, source_file = self._parse_path(source_path)
        target_file_system, target_file = self._parse_path(target_path)

        source_file_client = self.service_client.get_file_system_client(source_file_system).get_file_client(source_file)
        target_file_client = self.service_client.get_file_system_client(target_file_system).get_file_client(target_file)

        target_file_client.start_copy_from_url(source_file_client.url)

    def move_file(self, source_path, target_path):
        self.copy_file(source_path, target_path)
        self.delete_file(source_path)

    def delete_file(self, file_path):
        file_system, file_name = self._parse_path(file_path)
        file_client = self.service_client.get_file_system_client(file_system).get_file_client(file_name)
        file_client.delete_file()

    def list_files(self, file_system):
        file_system_client = self.service_client.get_file_system_client(file_system)
        return [file.name for file in file_system_client.get_paths()]

    def _parse_path(self, path):
        parts = path.lstrip('/').split('/', 1)
        if len(parts) == 1:
            return parts[0], ''
        return parts[0], parts[1]