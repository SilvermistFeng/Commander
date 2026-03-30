"""Demo data provider — works without any API key.

Returns realistic sample activities for popular cities so the
app can be tested and demonstrated without a Google API key.
When a real API key is available, the app automatically switches
to the Google Places provider instead.

To add a new demo city: add an entry to DEMO_CITIES below.
"""

from travel.models.trip import Activity, ActivityType
from travel.services.reviews.base import ReviewProvider


DEMO_CITIES: dict[str, list[Activity]] = {
    "rome": [
        Activity(id="rome-1", name="Colosseum", activity_type=ActivityType.ATTRACTION, latitude=41.8902, longitude=12.4922, review_score=4.7, review_count=189432, review_source="google", estimated_cost=16, estimated_minutes=120, address="Piazza del Colosseo, Rome"),
        Activity(id="rome-2", name="Vatican Museums", activity_type=ActivityType.ATTRACTION, latitude=41.9065, longitude=12.4536, review_score=4.6, review_count=142891, review_source="google", estimated_cost=17, estimated_minutes=180, address="Viale Vaticano, Rome"),
        Activity(id="rome-3", name="Trevi Fountain", activity_type=ActivityType.ATTRACTION, latitude=41.9009, longitude=12.4833, review_score=4.7, review_count=203841, review_source="google", estimated_cost=0, estimated_minutes=30, address="Piazza di Trevi, Rome"),
        Activity(id="rome-4", name="Pantheon", activity_type=ActivityType.ATTRACTION, latitude=41.8986, longitude=12.4769, review_score=4.8, review_count=167234, review_source="google", estimated_cost=5, estimated_minutes=45, address="Piazza della Rotonda, Rome"),
        Activity(id="rome-5", name="Roman Forum", activity_type=ActivityType.ATTRACTION, latitude=41.8925, longitude=12.4853, review_score=4.6, review_count=98321, review_source="google", estimated_cost=16, estimated_minutes=120, address="Via della Salara Vecchia, Rome"),
        Activity(id="rome-6", name="Borghese Gallery", activity_type=ActivityType.ATTRACTION, latitude=41.9142, longitude=12.4921, review_score=4.7, review_count=45231, review_source="google", estimated_cost=15, estimated_minutes=120, address="Piazzale Scipione Borghese, Rome"),
        Activity(id="rome-7", name="Spanish Steps", activity_type=ActivityType.ATTRACTION, latitude=41.9060, longitude=12.4828, review_score=4.5, review_count=112453, review_source="google", estimated_cost=0, estimated_minutes=30, address="Piazza di Spagna, Rome"),
        Activity(id="rome-8", name="Trastevere Walk", activity_type=ActivityType.ATTRACTION, latitude=41.8893, longitude=12.4700, review_score=4.6, review_count=34521, review_source="google", estimated_cost=0, estimated_minutes=90, address="Trastevere, Rome"),
        Activity(id="rome-9", name="Da Enzo al 29", activity_type=ActivityType.RESTAURANT, latitude=41.8870, longitude=12.4720, review_score=4.5, review_count=8923, review_source="google", estimated_cost=25, estimated_minutes=75, address="Via dei Vascellari 29, Rome"),
        Activity(id="rome-10", name="Roscioli", activity_type=ActivityType.RESTAURANT, latitude=41.8950, longitude=12.4740, review_score=4.6, review_count=6781, review_source="google", estimated_cost=35, estimated_minutes=75, address="Via dei Giubbonari 21, Rome"),
        Activity(id="rome-11", name="Pizzeria La Montecarlo", activity_type=ActivityType.RESTAURANT, latitude=41.8990, longitude=12.4720, review_score=4.3, review_count=12453, review_source="google", estimated_cost=12, estimated_minutes=60, address="Vicolo Savelli 13, Rome"),
        Activity(id="rome-12", name="Supplizio", activity_type=ActivityType.RESTAURANT, latitude=41.8975, longitude=12.4700, review_score=4.4, review_count=3241, review_source="google", estimated_cost=8, estimated_minutes=30, address="Via dei Banchi Vecchi 143, Rome"),
        Activity(id="rome-13", name="Sant'Eustachio Il Caffè", activity_type=ActivityType.CAFE, latitude=41.8982, longitude=12.4755, review_score=4.4, review_count=15672, review_source="google", estimated_cost=5, estimated_minutes=30, address="Piazza di S. Eustachio 82, Rome"),
        Activity(id="rome-14", name="Gelato di San Crispino", activity_type=ActivityType.CAFE, latitude=41.9012, longitude=12.4840, review_score=4.5, review_count=8932, review_source="google", estimated_cost=4, estimated_minutes=20, address="Via della Panetteria 42, Rome"),
        Activity(id="rome-15", name="Campo de' Fiori Market", activity_type=ActivityType.SHOPPING, latitude=41.8956, longitude=12.4722, review_score=4.3, review_count=21342, review_source="google", estimated_cost=15, estimated_minutes=60, address="Campo de' Fiori, Rome"),
    ],
    "tokyo": [
        Activity(id="tokyo-1", name="Senso-ji Temple", activity_type=ActivityType.ATTRACTION, latitude=35.7148, longitude=139.7967, review_score=4.6, review_count=156432, review_source="google", estimated_cost=0, estimated_minutes=60, address="Asakusa, Taito City, Tokyo"),
        Activity(id="tokyo-2", name="Meiji Jingu Shrine", activity_type=ActivityType.ATTRACTION, latitude=35.6764, longitude=139.6993, review_score=4.7, review_count=98231, review_source="google", estimated_cost=0, estimated_minutes=90, address="Yoyogi, Shibuya City, Tokyo"),
        Activity(id="tokyo-3", name="Shibuya Crossing", activity_type=ActivityType.ATTRACTION, latitude=35.6595, longitude=139.7004, review_score=4.4, review_count=187654, review_source="google", estimated_cost=0, estimated_minutes=30, address="Shibuya, Tokyo"),
        Activity(id="tokyo-4", name="TeamLab Borderless", activity_type=ActivityType.ENTERTAINMENT, latitude=35.6268, longitude=139.7839, review_score=4.5, review_count=45231, review_source="google", estimated_cost=30, estimated_minutes=150, address="Azabudai Hills, Tokyo"),
        Activity(id="tokyo-5", name="Tsukiji Outer Market", activity_type=ActivityType.SHOPPING, latitude=35.6654, longitude=139.7707, review_score=4.5, review_count=67843, review_source="google", estimated_cost=20, estimated_minutes=90, address="Tsukiji, Chuo City, Tokyo"),
        Activity(id="tokyo-6", name="Tokyo Skytree", activity_type=ActivityType.ATTRACTION, latitude=35.7101, longitude=139.8107, review_score=4.4, review_count=112342, review_source="google", estimated_cost=20, estimated_minutes=90, address="Sumida City, Tokyo"),
        Activity(id="tokyo-7", name="Akihabara Electric Town", activity_type=ActivityType.SHOPPING, latitude=35.7023, longitude=139.7745, review_score=4.3, review_count=54321, review_source="google", estimated_cost=30, estimated_minutes=120, address="Akihabara, Chiyoda City, Tokyo"),
        Activity(id="tokyo-8", name="Shinjuku Gyoen Garden", activity_type=ActivityType.ATTRACTION, latitude=35.6852, longitude=139.7100, review_score=4.6, review_count=78432, review_source="google", estimated_cost=5, estimated_minutes=90, address="Shinjuku, Tokyo"),
        Activity(id="tokyo-9", name="Ichiran Ramen Shibuya", activity_type=ActivityType.RESTAURANT, latitude=35.6610, longitude=139.6982, review_score=4.3, review_count=23451, review_source="google", estimated_cost=12, estimated_minutes=45, address="Shibuya, Tokyo"),
        Activity(id="tokyo-10", name="Sushi Dai", activity_type=ActivityType.RESTAURANT, latitude=35.6455, longitude=139.7810, review_score=4.6, review_count=8923, review_source="google", estimated_cost=40, estimated_minutes=60, address="Toyosu Market, Tokyo"),
        Activity(id="tokyo-11", name="Afuri Ramen", activity_type=ActivityType.RESTAURANT, latitude=35.6498, longitude=139.7113, review_score=4.4, review_count=12341, review_source="google", estimated_cost=10, estimated_minutes=45, address="Ebisu, Shibuya City, Tokyo"),
        Activity(id="tokyo-12", name="Gonpachi Nishi-Azabu", activity_type=ActivityType.RESTAURANT, latitude=35.6541, longitude=139.7260, review_score=4.2, review_count=15432, review_source="google", estimated_cost=30, estimated_minutes=75, address="Nishi-Azabu, Minato City, Tokyo"),
        Activity(id="tokyo-13", name="Omotesando Coffee", activity_type=ActivityType.CAFE, latitude=35.6654, longitude=139.7121, review_score=4.5, review_count=4531, review_source="google", estimated_cost=6, estimated_minutes=30, address="Omotesando, Shibuya, Tokyo"),
        Activity(id="tokyo-14", name="Robot Restaurant", activity_type=ActivityType.ENTERTAINMENT, latitude=35.6938, longitude=139.7034, review_score=4.0, review_count=34521, review_source="google", estimated_cost=55, estimated_minutes=120, address="Shinjuku, Tokyo"),
        Activity(id="tokyo-15", name="Golden Gai", activity_type=ActivityType.ENTERTAINMENT, latitude=35.6942, longitude=139.7044, review_score=4.3, review_count=28734, review_source="google", estimated_cost=15, estimated_minutes=90, address="Shinjuku, Tokyo"),
    ],
    "paris": [
        Activity(id="paris-1", name="Eiffel Tower", activity_type=ActivityType.ATTRACTION, latitude=48.8584, longitude=2.2945, review_score=4.7, review_count=298432, review_source="google", estimated_cost=26, estimated_minutes=120, address="Champ de Mars, Paris"),
        Activity(id="paris-2", name="Louvre Museum", activity_type=ActivityType.ATTRACTION, latitude=48.8606, longitude=2.3376, review_score=4.7, review_count=267891, review_source="google", estimated_cost=17, estimated_minutes=180, address="Rue de Rivoli, Paris"),
        Activity(id="paris-3", name="Sacré-Cœur", activity_type=ActivityType.ATTRACTION, latitude=48.8867, longitude=2.3431, review_score=4.7, review_count=145231, review_source="google", estimated_cost=0, estimated_minutes=60, address="Montmartre, Paris"),
        Activity(id="paris-4", name="Musée d'Orsay", activity_type=ActivityType.ATTRACTION, latitude=48.8600, longitude=2.3266, review_score=4.7, review_count=112453, review_source="google", estimated_cost=16, estimated_minutes=120, address="1 Rue de la Légion d'Honneur, Paris"),
        Activity(id="paris-5", name="Notre-Dame (exterior)", activity_type=ActivityType.ATTRACTION, latitude=48.8530, longitude=2.3499, review_score=4.6, review_count=189432, review_source="google", estimated_cost=0, estimated_minutes=45, address="6 Parvis Notre-Dame, Paris"),
        Activity(id="paris-6", name="Arc de Triomphe", activity_type=ActivityType.ATTRACTION, latitude=48.8738, longitude=2.2950, review_score=4.6, review_count=134231, review_source="google", estimated_cost=13, estimated_minutes=60, address="Place Charles de Gaulle, Paris"),
        Activity(id="paris-7", name="Luxembourg Gardens", activity_type=ActivityType.ATTRACTION, latitude=48.8462, longitude=2.3372, review_score=4.7, review_count=87654, review_source="google", estimated_cost=0, estimated_minutes=60, address="6th arrondissement, Paris"),
        Activity(id="paris-8", name="Sainte-Chapelle", activity_type=ActivityType.ATTRACTION, latitude=48.8554, longitude=2.3451, review_score=4.8, review_count=56432, review_source="google", estimated_cost=11, estimated_minutes=45, address="10 Bd du Palais, Paris"),
        Activity(id="paris-9", name="Le Bouillon Chartier", activity_type=ActivityType.RESTAURANT, latitude=48.8746, longitude=2.3486, review_score=4.3, review_count=34521, review_source="google", estimated_cost=18, estimated_minutes=75, address="7 Rue du Faubourg Montmartre, Paris"),
        Activity(id="paris-10", name="L'As du Fallafel", activity_type=ActivityType.RESTAURANT, latitude=48.8570, longitude=2.3583, review_score=4.4, review_count=21342, review_source="google", estimated_cost=10, estimated_minutes=30, address="34 Rue des Rosiers, Paris"),
        Activity(id="paris-11", name="Café de Flore", activity_type=ActivityType.CAFE, latitude=48.8540, longitude=2.3326, review_score=4.2, review_count=18932, review_source="google", estimated_cost=12, estimated_minutes=45, address="172 Bd Saint-Germain, Paris"),
        Activity(id="paris-12", name="Pierre Hermé", activity_type=ActivityType.CAFE, latitude=48.8512, longitude=2.3360, review_score=4.6, review_count=8723, review_source="google", estimated_cost=8, estimated_minutes=20, address="72 Rue Bonaparte, Paris"),
        Activity(id="paris-13", name="Le Marais Walk", activity_type=ActivityType.ATTRACTION, latitude=48.8566, longitude=2.3622, review_score=4.5, review_count=23451, review_source="google", estimated_cost=0, estimated_minutes=90, address="Le Marais, Paris"),
        Activity(id="paris-14", name="Galeries Lafayette", activity_type=ActivityType.SHOPPING, latitude=48.8738, longitude=2.3320, review_score=4.4, review_count=67843, review_source="google", estimated_cost=30, estimated_minutes=90, address="40 Bd Haussmann, Paris"),
        Activity(id="paris-15", name="Moulin Rouge (show)", activity_type=ActivityType.ENTERTAINMENT, latitude=48.8841, longitude=2.3323, review_score=4.3, review_count=45231, review_source="google", estimated_cost=90, estimated_minutes=150, address="82 Bd de Clichy, Paris"),
    ],
    "xian": [
        Activity(id="xian-1", name="Terracotta Warriors Museum", activity_type=ActivityType.ATTRACTION, latitude=34.3847, longitude=109.2785, review_score=4.7, review_count=89432, review_source="google", estimated_cost=20, estimated_minutes=180, address="Lintong District, Xi'an"),
        Activity(id="xian-2", name="Ancient City Wall", activity_type=ActivityType.ATTRACTION, latitude=34.2617, longitude=108.9461, review_score=4.6, review_count=67231, review_source="google", estimated_cost=8, estimated_minutes=120, address="South Gate, Xi'an"),
        Activity(id="xian-3", name="Muslim Quarter", activity_type=ActivityType.SHOPPING, latitude=34.2627, longitude=108.9400, review_score=4.5, review_count=54321, review_source="google", estimated_cost=15, estimated_minutes=120, address="Beiyuanmen, Xi'an"),
        Activity(id="xian-4", name="Big Wild Goose Pagoda", activity_type=ActivityType.ATTRACTION, latitude=34.2187, longitude=108.9596, review_score=4.5, review_count=45231, review_source="google", estimated_cost=6, estimated_minutes=90, address="Yanta District, Xi'an"),
        Activity(id="xian-5", name="Shaanxi History Museum", activity_type=ActivityType.ATTRACTION, latitude=34.2259, longitude=108.9548, review_score=4.6, review_count=34521, review_source="google", estimated_cost=0, estimated_minutes=120, address="91 Xiaozhai East Rd, Xi'an"),
        Activity(id="xian-6", name="Bell Tower", activity_type=ActivityType.ATTRACTION, latitude=34.2613, longitude=108.9452, review_score=4.3, review_count=23451, review_source="google", estimated_cost=5, estimated_minutes=45, address="Bell Tower, Xi'an"),
        Activity(id="xian-7", name="Great Mosque of Xi'an", activity_type=ActivityType.ATTRACTION, latitude=34.2626, longitude=108.9375, review_score=4.5, review_count=18932, review_source="google", estimated_cost=3, estimated_minutes=60, address="Huajue Alley, Xi'an"),
        Activity(id="xian-8", name="Mount Huashan Day Trip", activity_type=ActivityType.ATTRACTION, latitude=34.4748, longitude=110.0870, review_score=4.7, review_count=28734, review_source="google", estimated_cost=25, estimated_minutes=480, address="Huayin, near Xi'an"),
        Activity(id="xian-9", name="Xi'an Dumpling Banquet", activity_type=ActivityType.RESTAURANT, latitude=34.2561, longitude=108.9425, review_score=4.4, review_count=12341, review_source="google", estimated_cost=15, estimated_minutes=75, address="De Fa Chang, Xi'an"),
        Activity(id="xian-10", name="Paomo Soup Restaurant", activity_type=ActivityType.RESTAURANT, latitude=34.2600, longitude=108.9380, review_score=4.3, review_count=8923, review_source="google", estimated_cost=8, estimated_minutes=60, address="Muslim Quarter, Xi'an"),
        Activity(id="xian-11", name="Biangbiang Noodles", activity_type=ActivityType.RESTAURANT, latitude=34.2622, longitude=108.9410, review_score=4.5, review_count=6781, review_source="google", estimated_cost=5, estimated_minutes=45, address="Muslim Quarter, Xi'an"),
        Activity(id="xian-12", name="Roujiamo Street Food", activity_type=ActivityType.RESTAURANT, latitude=34.2630, longitude=108.9395, review_score=4.4, review_count=15672, review_source="google", estimated_cost=3, estimated_minutes=20, address="Muslim Quarter, Xi'an"),
        Activity(id="xian-13", name="Tang Dynasty Show", activity_type=ActivityType.ENTERTAINMENT, latitude=34.2400, longitude=108.9500, review_score=4.2, review_count=9823, review_source="google", estimated_cost=35, estimated_minutes=120, address="Chang'an Road, Xi'an"),
        Activity(id="xian-14", name="Small Wild Goose Pagoda", activity_type=ActivityType.ATTRACTION, latitude=34.2416, longitude=108.9383, review_score=4.4, review_count=21342, review_source="google", estimated_cost=0, estimated_minutes=60, address="Youyi West Rd, Xi'an"),
        Activity(id="xian-15", name="Huimin Street Night Market", activity_type=ActivityType.ENTERTAINMENT, latitude=34.2625, longitude=108.9390, review_score=4.3, review_count=34521, review_source="google", estimated_cost=10, estimated_minutes=90, address="Muslim Quarter, Xi'an"),
    ],
}


class DemoProvider(ReviewProvider):
    """Returns sample data for demo cities — no API key needed."""

    @property
    def source_name(self) -> str:
        return "demo"

    async def search_activities(
        self,
        city: str,
        activity_types: list[str],
        limit: int = 50,
    ) -> list[Activity]:
        """Return demo activities for known cities."""
        # Match city name (case-insensitive, partial match)
        city_lower = city.lower().split(",")[0].strip()
        for key, activities in DEMO_CITIES.items():
            if key in city_lower or city_lower in key:
                filtered = [
                    a for a in activities
                    if activity_types == [] or a.activity_type.value in activity_types
                ]
                return filtered[:limit]

        # Unknown city — return empty (will show helpful error)
        return []
