import logging
import os
from typing import Any, Optional

from pydantic import model_validator
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # Application
    app_name: str = "FastAPI Modular Template"
    debug: bool = False
    version: str = "1.0.0"

    # Database — optional here so Pydantic doesn't reject a missing value
    # before our validator can emit a helpful message.
    database_url: Optional[str] = None

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # AWS Lambda Configuration
    is_lambda: bool = False
    lambda_function_name: str = "fastapi-backend"
    aws_region: str = "us-east-1"

    @model_validator(mode="after")
    def _validate_database_url(self) -> "Settings":
        """Ensure DATABASE_URL is present and has been expanded by the runtime.

        Railway expands reference variables (e.g. ``${{Postgres.DATABASE_URL}}``)
        at container start.  If the value is still absent or empty at this point
        the variable was never resolved, and we surface a clear error rather than
        letting SQLAlchemy fail with a cryptic message later.
        """
        # Re-read directly from the environment so we pick up the value even
        # when Pydantic's own env-loading ran before Railway finished expanding
        # the reference variable.
        raw = os.environ.get("DATABASE_URL", "").strip()

        if raw:
            # Prefer the live env value (handles late expansion edge-cases)
            self.database_url = raw
        elif not self.database_url:
            raise ValueError(
                "DATABASE_URL environment variable is required but was not found. "
                "If you are using a Railway Postgres service, make sure the variable "
                "reference (${{Postgres.DATABASE_URL}}) is set in your service's "
                "environment and that the Postgres service is deployed and healthy."
            )

        return self

    @property
    def backend_url(self) -> str:
        """Generate backend URL from host and port."""
        if self.is_lambda:
            # In Lambda environment, return the API Gateway URL
            return os.environ.get(
                "PYTHON_BACKEND_URL", f"https://{self.lambda_function_name}.execute-api.{self.aws_region}.amazonaws.com"
            )
        else:
            # Use localhost for external callbacks instead of 0.0.0.0
            display_host = "127.0.0.1" if self.host == "0.0.0.0" else self.host
            return os.environ.get("PYTHON_BACKEND_URL", f"http://{display_host}:{self.port}")

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

    def __getattr__(self, name: str) -> Any:
        """
        Dynamically read attributes from environment variables.
        For example: settings.opapi_key reads from OPAPI_KEY environment variable.

        Args:
            name: Attribute name (e.g., 'opapi_key')

        Returns:
            Value from environment variable

        Raises:
            AttributeError: If attribute doesn't exist and not found in environment variables
        """
        # Convert attribute name to environment variable name (snake_case -> UPPER_CASE)
        env_var_name = name.upper()

        # Check if environment variable exists
        if env_var_name in os.environ:
            value = os.environ[env_var_name]
            # Cache the value in instance dict to avoid repeated lookups
            self.__dict__[name] = value
            logger.debug(f"Read dynamic attribute {name} from environment variable {env_var_name}")
            return value

        # If not found, raise AttributeError to maintain normal Python behavior
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")


# Global settings instance
settings = Settings()
