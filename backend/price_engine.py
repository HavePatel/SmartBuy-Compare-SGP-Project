import os
import sqlite3
import random
import time
import threading
from datetime import datetime

from backend.extensions import db
from backend.models import TrackedProduct, PriceAlert

def run_engine_loop(app):
    with app.app_context():
        while True:
            time.sleep(45)
            
            tracked = TrackedProduct.query.all()
            if not tracked:
                continue
                
            db_path = app.config["SQLITE_DB_PATH"]
            
            product_dict = {}
            for t in tracked:
                if t.product_id not in product_dict:
                    product_dict[t.product_id] = []
                product_dict[t.product_id].append(t)
                
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            for product_id, tracking_users in product_dict.items():
                history = cursor.execute(
                    "SELECT price FROM price_history WHERE product_id=? ORDER BY recorded_at DESC LIMIT 1", 
                    (product_id,)
                ).fetchone()
                
                if not history:
                    continue
                    
                old_price = float(history["price"])
                
                change = random.randint(20, 50)
                direction = random.choice([1, -1])
                new_price = old_price + (change * direction)
                if new_price <= 0:
                    new_price = old_price 
                    
                cursor.execute(
                    "INSERT INTO price_history (product_id, price, recorded_at) VALUES (?, ?, ?)",
                    (product_id, new_price, datetime.utcnow().isoformat())
                )
                
                if new_price < old_price:
                    for t in tracking_users:
                        is_high = False
                        if t.target_price and new_price <= t.target_price:
                            is_high = True
                            
                        alert = PriceAlert(
                            user_id=t.user_id,
                            product_id=product_id,
                            product_name=t.product_name,
                            old_price=old_price,
                            new_price=new_price,
                            is_high_priority=is_high
                        )
                        db.session.add(alert)
                        
            conn.commit()
            conn.close()
            db.session.commit()

def start_price_engine(app):
    # Only run once if using Werkzeug reloader
    if os.environ.get("WERKZEUG_RUN_MAIN") != "true" and app.debug:
        return
    thread = threading.Thread(target=run_engine_loop, args=(app,), daemon=True)
    thread.start()
