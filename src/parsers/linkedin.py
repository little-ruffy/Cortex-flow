from linkedin_api import Linkedin
from typing import List, Dict, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LinkedInParser:
    def __init__(self, email: str, password: str):
        self.api = None
        if email and password:
            try:
                self.api = Linkedin(email, password)
            except Exception as e:
                pass

    def get_posts(self, public_profile_id: str, limit: int = 50) -> List[Dict]:
        posts_data = []
        if not self.api:
            return []

        try:
            profile = self.api.get_profile(public_profile_id)
            urn_id = profile.get('profile_id')
            
            if not urn_id:
                return []

            posts = self.api.get_profile_posts(urn_id, limit=limit)
            
            for post in posts:
                text = post.get('commentary', {}).get('text', {}).get('text', '')
                if not text:
                    text = post.get('summary', {}).get('text', '')

                posts_data.append({
                    "source": "linkedin",
                    "id": post.get('urn', ''),
                    "text": text,
                    "likes": post.get('socialDetail', {}).get('totalSocialActivityCounts', {}).get('numLikes', 0),
                    "comments": post.get('socialDetail', {}).get('totalSocialActivityCounts', {}).get('numComments', 0),
                    "date": "",
                    "url": f"https://www.linkedin.com/feed/update/{post.get('urn', '')}"
                })

        except Exception as e:
            pass

        return posts_data
