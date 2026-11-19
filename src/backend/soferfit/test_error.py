from django.http import HttpResponse

def sentry_test_error(request):
    # This view deliberately raises an exception to test Sentry integration
    raise Exception("Sentry test error triggered at runtime")
