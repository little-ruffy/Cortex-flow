import textstat
from textblob import TextBlob
from collections import Counter
import re

class StyleService:
    def analyze_style(self, text: str) -> dict:
        if not text or not text.strip():
            return {}
        
        flesch_ease = textstat.flesch_reading_ease(text)
        flesch_grade = textstat.flesch_kincaid_grade(text)
        
        blob = TextBlob(text)
        sentiment = blob.sentiment
        tone = {
            "polarity": sentiment.polarity,
            "subjectivity": sentiment.subjectivity
        }
        
        words = re.findall(r'\w+', text.lower())
        stopwords = set(["the", "and", "is", "in", "to", "of", "a", "for", "on", "with", "it", "this", "that"])
        filtered_words = [w for w in words if w not in stopwords and len(w) > 3]
        top_keywords = Counter(filtered_words).most_common(10)
        
        return {
            "flesch_reading_ease": flesch_ease,
            "flesch_kincaid_grade": flesch_grade,
            "tone": tone,
            "top_keywords": top_keywords,
            "avg_sentence_length": textstat.avg_sentence_length(text)
        }

    def evaluate_similarity(self, text1: str, text2: str) -> dict:
        words1 = set(re.findall(r'\w+', text1.lower()))
        words2 = set(re.findall(r'\w+', text2.lower()))
        
        if not words1 or not words2:
             return {"similarity_score": 0.0}
             
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        jaccard = len(intersection) / len(union)
        
        return {
            "similarity_score": jaccard,
            "burrows_delta_proxy": 1.0 - jaccard
        }

style_service = StyleService()
