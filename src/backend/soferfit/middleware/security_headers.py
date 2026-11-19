from django.utils.deprecation import MiddlewareMixin

class SecurityHeadersMiddleware(MiddlewareMixin):
    """Add CSP, HSTS and other security headers.
    The middleware is inserted after SecurityMiddleware.
    """
    def process_response(self, request, response):
        # Content Security Policy – restrict sources to self and trusted CDNs
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "font-src 'self' data:; "
            "connect-src 'self' https://api.example.com; "
        )
        response["Content-Security-Policy"] = csp
        # Already set HSTS in settings, but ensure header is present
        if getattr(request, "secure", False):
            response["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        return response
