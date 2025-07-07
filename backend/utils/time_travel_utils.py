import datetime
import re

class MockDate(datetime.date):
    @classmethod
    def today(cls):
        return cls._mock_today

class MockDateTime(datetime.datetime):
    @classmethod
    def now(cls, tz=None):
        return cls._mock_now.replace(tzinfo=tz)

def get_mocked_datetime_env(fake_date: datetime.date):
    # Set the mock date/time
    MockDate._mock_today = fake_date
    MockDateTime._mock_now = datetime.datetime.combine(fake_date, datetime.time())
    # Provide these mocks in the exec environment
    run_date = MockDateTime._mock_now
    return {
        "datetime": datetime,
        "date": MockDate,
        "datetime_class": MockDateTime,
        "run_date": run_date,
    }
    
def patch_datetime_calls(code_str):
    # Replace datetime.now() and date.today() with run_date
    code_str = re.sub(r'datetime\.now\(\)', 'run_date', code_str)
    code_str = re.sub(r'datetime\.today\(\)', 'run_date.date()', code_str)
    code_str = re.sub(r'datetime\.date\(\)', 'run_date.date()', code_str)
    code_str = re.sub(r'date\.now\(\)', 'run_date', code_str)
    code_str = re.sub(r'date\.today\(\)', 'run_date.date()', code_str)
    return code_str