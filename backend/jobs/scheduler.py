class TaskScheduler:
    def __init__(self):
        self.tasks = {}

    def schedule_task(self, task_id, task_details, schedule_time):
        self.tasks[task_id] = {
            'details': task_details,
            'schedule_time': schedule_time,
            'status': 'scheduled'
        }

    def run_task(self, task_id):
        if task_id in self.tasks:
            task = self.tasks[task_id]
            task['status'] = 'running'
            # Logic to execute the task goes here
            task['status'] = 'completed'
            return task
        return None

    def get_task_status(self, task_id):
        return self.tasks.get(task_id, {}).get('status', 'not found')