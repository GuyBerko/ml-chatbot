import threading

def read_txt_lines(path):
    with open(path) as f:
        lines = f.read().splitlines()
    return lines


def read_txt(path):
    with open(path) as f:
        txt = f.read()
    return txt

class ThreadJob(threading.Thread):
    def __init__(self, callback, event, interval, kwargs):
        """runs the callback function after interval seconds

        :param callback:  callback function to invoke
        :param event: external event for controlling the update operation
        :param interval: time in seconds after which are required to fire the callback
        :param kwargs: keyworded, variable-length argument list for callback function
        :type callback: function
        :type interval: int
        """
        self.callback = callback
        self.event = event
        self.interval = interval
        self.kwargs = kwargs
        super(ThreadJob, self).__init__()

    def run(self):
        while not self.event.wait(self.interval):
            if not self.kwargs:
                self.callback()
            else:
                self.callback(**self.kwargs)


def start_thread_job(func, interval, **kwargs):
    event = threading.Event()
    thread_job = ThreadJob(func, event, interval, kwargs)
    thread_job.start()

