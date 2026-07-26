from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# LƯU Ý: Bạn cần thay đổi thông tin kết nối này cho phù hợp với SQL Server của bạn
# Ví dụ: mssql+pyodbc://<username>:<password>@<server_name>/InLoveDB?driver=ODBC+Driver+17+for+SQL+Server
# Nếu dùng Windows Authentication (Local):
SQLALCHEMY_DATABASE_URL = "mssql+pyodbc://DESKTOP-S4263AC\\SQLEXPRESS/InLoveDB?driver=ODBC+Driver+17+for+SQL+Server&Trusted_Connection=yes"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency để lấy session database cho mỗi request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
