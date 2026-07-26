from app.database import engine, Base
from app import models
import logging

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Create the new table
print("Creating Messages table if not exists...")
models.Message.__table__.create(engine, checkfirst=True)
print("Done.")
