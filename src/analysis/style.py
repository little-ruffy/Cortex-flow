import textstat
import re
from typing import List, Dict, Any
from collections import Counter
import numpy as np

class StyleAnalyzer:
    def __init__(self):
        pass

    def extract_metrics(self, text: str) -> Dict[str, float]:
        if not text or not text.strip():
            return {
                "length": 0,
                "emoji_density": 0,
                "readability": 0,
                "sentence_count": 0,
                "reading_time": 0,
                "grade_level": 0
            }
            
        words = text.split()
        length = len(words)
        
        emoji_pattern = re.compile(r'[^\w\s,.]')
        emoji_count = len(emoji_pattern.findall(text))
        emoji_density = (emoji_count / length) * 100 if length > 0 else 0
        
        readability = textstat.flesch_reading_ease(text)
        grade_level = textstat.flesch_kincaid_grade(text)
        reading_time = textstat.reading_time(text, ms_per_char=14.6) 
        
        sentence_count = text.count('.') + text.count('!') + text.count('?')
        if sentence_count == 0 and length > 0:
            sentence_count = 1
            
        return {
            "length": length,
            "emoji_density": emoji_density,
            "readability": readability,
            "sentence_count": sentence_count,
            "reading_time": reading_time,
            "grade_level": grade_level
        }

    @staticmethod
    def calculate_wasserstein_distance(u_values: List[float], v_values: List[float]) -> float:
        try:
            from scipy.stats import wasserstein_distance
            return wasserstein_distance(u_values, v_values)
        except ImportError:
            u_sorted = np.sort(u_values)
            v_sorted = np.sort(v_values)
            
            if len(u_sorted) != len(v_sorted):
                common_len = max(len(u_sorted), len(v_sorted))
                u_sorted = np.interp(np.linspace(0, 1, common_len), np.linspace(0, 1, len(u_sorted)), u_sorted)
                v_sorted = np.interp(np.linspace(0, 1, common_len), np.linspace(0, 1, len(v_sorted)), v_sorted)
                
            return np.mean(np.abs(u_sorted - v_sorted))

    def analyze_style(self, texts: List[str]) -> Dict[str, Any]:
        if not texts:
            return {
                "avg_length": 0,
                "emoji_density": 0,
                "readability_score": 0,
                "tone": "Neutral",
                "top_keywords": [],
                "structure_features": [],
                "metrics_distribution": {}
            }

        metrics_list = [self.extract_metrics(t) for t in texts]
        
        lengths = [m['length'] for m in metrics_list]
        avg_length = np.mean(lengths) if lengths else 0
        
        emoji_densities = [m['emoji_density'] for m in metrics_list]
        avg_emoji_density = np.mean(emoji_densities) if emoji_densities else 0

        readability_scores = [m['readability'] for m in metrics_list]
        avg_readability = np.mean(readability_scores) if readability_scores else 0

        sentence_counts = [m['sentence_count'] for m in metrics_list]
        avg_sentence_count = np.mean(sentence_counts) if sentence_counts else 0

        grade_levels = [m['grade_level'] for m in metrics_list]
        avg_grade_level = np.mean(grade_levels) if grade_levels else 0

        reading_times = [m['reading_time'] for m in metrics_list]
        avg_reading_time = np.mean(reading_times) if reading_times else 0

        all_words = " ".join(texts).lower().split()
        stopwords = set(['the', 'and', 'to', 'of', 'a', 'in', 'is', 'that', 'for', 'it', 'on', 'with', 'as', 'this', 'was', 'at', 'by', 'an', 'be'])
        filtered_words = [w for w in all_words if w.isalnum() and w not in stopwords and len(w) > 3]
        word_counts = Counter(filtered_words)
        top_keywords = word_counts.most_common(10)

        structure_features = []
        if any('#' in t for t in texts):
            structure_features.append("Uses Hashtags")
        if any('\n-' in t or '\n*' in t for t in texts):
            structure_features.append("Uses Bullet Points")
        if avg_length < 20:
            structure_features.append("Short & Punchy")
        elif avg_length > 100:
            structure_features.append("Long-form")

        tone = "Neutral"
        if avg_readability > 70:
            tone = "Simple & Accessible"
        elif avg_readability < 30:
            tone = "Complex & Academic"
        
        if avg_emoji_density > 2:
            tone += ", Expressive/Casual"
        
        return {
            "avg_length": round(avg_length, 1),
            "emoji_density": round(avg_emoji_density, 1),
            "readability_score": round(avg_readability, 1),
            "sentence_count": round(avg_sentence_count, 1),
            "grade_level": round(avg_grade_level, 1),
            "reading_time": round(avg_reading_time, 1),
            "tone": tone,
            "top_keywords": [w[0] for w in top_keywords],
            "structure_features": structure_features,
            "metrics_distribution": {
                "length": lengths,
                "emoji_density": emoji_densities,
                "readability": readability_scores
            }
        }

class FluencyScorer:
    def score(self, text: str) -> float:
        if not text.strip():
            return 0.0
        return textstat.flesch_reading_ease(text)
