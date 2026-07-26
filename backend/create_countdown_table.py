from app.database import engine, Base
from app import models
import logging

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

print('Creating CountdownEvents table if not exists...')
models.CountdownEvent.__table__.create(engine, checkfirst=True)
print('Done.')
