import instaloader
from typing import List, Dict, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InstagramParser:
    def __init__(self, username: Optional[str] = None, password: Optional[str] = None):
        self.loader = instaloader.Instaloader()
        self.logged_in = False
        if username and password:
            try:
                self.loader.login(username, password)
                self.logged_in = True
            except Exception as e:
                pass

    def get_posts(self, target_username: str, limit: int = 50) -> List[Dict]:
        posts_data = []
        try:
            profile = instaloader.Profile.from_username(self.loader.context, target_username)
            
            count = 0
            for post in profile.get_posts():
                if count >= limit:
                    break
                
                posts_data.append({
                    "source": "instagram",
                    "id": post.shortcode,
                    "text": post.caption if post.caption else "",
                    "likes": post.likes,
                    "comments": post.comments,
                    "date": post.date_local.isoformat(),
                    "url": f"https://www.instagram.com/p/{post.shortcode}/"
                })
                count += 1
                
        except Exception as e:
            pass
            
        return posts_data
