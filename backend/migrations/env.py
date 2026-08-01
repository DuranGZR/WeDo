from logging.config import fileConfig

from alembic import context
from app.core.config import settings
from app.db.base import Base
from app.modules.activities import models as activity_models  # noqa: F401
from app.modules.auth import models as auth_models  # noqa: F401
from app.modules.comments import models as comment_models  # noqa: F401
from app.modules.invitations import models as invitation_models  # noqa: F401
from app.modules.items import models as item_models  # noqa: F401
from app.modules.lists import models as list_models  # noqa: F401
from app.modules.memories import models as memory_models  # noqa: F401
from app.modules.notifications import models as notification_models  # noqa: F401
from app.modules.plans import models as plan_models  # noqa: F401
from app.modules.reactions import models as reaction_models  # noqa: F401
from app.modules.uploads import models as upload_models  # noqa: F401
from app.modules.users import models as user_models  # noqa: F401
from sqlalchemy import engine_from_config, pool

config = context.config
config.set_main_option("sqlalchemy.url", str(settings.database_url).replace("%", "%%"))
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=str(settings.database_url),
        target_metadata=target_metadata,
        literal_binds=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
