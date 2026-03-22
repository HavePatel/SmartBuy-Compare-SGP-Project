import random

def get_live_product_data(product_id, current_offers):
    """
    Simulates a live API by taking existing db offers
    and applying dynamic variations to price and delivery days.
    (Quick simulation mode for the building phase)
    """
    live_offers = []
    for offer in current_offers:
        live_offer = dict(offer)
        
        # Randomize price by -5% to +5%
        price_multiplier = random.uniform(0.95, 1.05)
        current_price = float(live_offer.get("price", 0))
        live_offer["price"] = int(round(current_price * price_multiplier))
        
        # Randomize delivery days by -1 to +2, minimum 1 day
        day_shift = random.randint(-1, 2)
        current_days = int(live_offer.get("delivery_days", 1))
        live_offer["delivery_days"] = max(1, current_days + day_shift)
        
        live_offers.append(live_offer)
        
    return live_offers
