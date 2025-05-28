import os
import shutil
class LocalStorageAdapter:
    

    def copy_file(self, source: str, destination: str) -> None:
        if not os.path.exists(source):
            raise FileNotFoundError(f"Source file '{source}' does not exist.")
        shutil.copy2(source, destination)

    def move_file(self, source: str, destination: str) -> None:
        if not os.path.exists(source):
            raise FileNotFoundError(f"Source file '{source}' does not exist.")
        shutil.move(source, destination)

    def list_files(self, directory: str) -> list:
        if not os.path.isdir(directory):
            raise NotADirectoryError(f"'{directory}' is not a valid directory.")
        return os.listdir(directory)