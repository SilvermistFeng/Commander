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
    "london": [
        Activity(id="london-1", name="British Museum", activity_type=ActivityType.ATTRACTION, latitude=51.5194, longitude=-0.1270, review_score=4.7, review_count=234561, review_source="google", estimated_cost=0, estimated_minutes=180, address="Great Russell St, London"),
        Activity(id="london-2", name="Tower of London", activity_type=ActivityType.ATTRACTION, latitude=51.5081, longitude=-0.0759, review_score=4.6, review_count=178432, review_source="google", estimated_cost=30, estimated_minutes=150, address="Tower Hill, London"),
        Activity(id="london-3", name="Buckingham Palace", activity_type=ActivityType.ATTRACTION, latitude=51.5014, longitude=-0.1419, review_score=4.5, review_count=198234, review_source="google", estimated_cost=30, estimated_minutes=120, address="Buckingham Palace, London"),
        Activity(id="london-4", name="Westminster Abbey", activity_type=ActivityType.ATTRACTION, latitude=51.4993, longitude=-0.1273, review_score=4.6, review_count=112453, review_source="google", estimated_cost=25, estimated_minutes=90, address="20 Deans Yd, London"),
        Activity(id="london-5", name="Tate Modern", activity_type=ActivityType.ATTRACTION, latitude=51.5076, longitude=-0.0994, review_score=4.5, review_count=134231, review_source="google", estimated_cost=0, estimated_minutes=120, address="Bankside, London"),
        Activity(id="london-6", name="Hyde Park", activity_type=ActivityType.ATTRACTION, latitude=51.5073, longitude=-0.1657, review_score=4.7, review_count=167432, review_source="google", estimated_cost=0, estimated_minutes=90, address="Hyde Park, London"),
        Activity(id="london-7", name="Natural History Museum", activity_type=ActivityType.ATTRACTION, latitude=51.4967, longitude=-0.1764, review_score=4.7, review_count=145231, review_source="google", estimated_cost=0, estimated_minutes=150, address="Cromwell Rd, London"),
        Activity(id="london-8", name="Borough Market", activity_type=ActivityType.SHOPPING, latitude=51.5055, longitude=-0.0910, review_score=4.5, review_count=87654, review_source="google", estimated_cost=20, estimated_minutes=90, address="8 Southwark St, London"),
        Activity(id="london-9", name="Dishoom King's Cross", activity_type=ActivityType.RESTAURANT, latitude=51.5326, longitude=-0.1246, review_score=4.6, review_count=23451, review_source="google", estimated_cost=25, estimated_minutes=75, address="5 Stable St, London"),
        Activity(id="london-10", name="Padella", activity_type=ActivityType.RESTAURANT, latitude=51.5054, longitude=-0.0920, review_score=4.5, review_count=12341, review_source="google", estimated_cost=15, estimated_minutes=60, address="6 Southwark St, London"),
        Activity(id="london-11", name="Flat Iron Steak", activity_type=ActivityType.RESTAURANT, latitude=51.5133, longitude=-0.1312, review_score=4.4, review_count=18932, review_source="google", estimated_cost=18, estimated_minutes=60, address="17 Beak St, London"),
        Activity(id="london-12", name="Monmouth Coffee", activity_type=ActivityType.CAFE, latitude=51.5056, longitude=-0.0908, review_score=4.5, review_count=8723, review_source="google", estimated_cost=5, estimated_minutes=30, address="2 Park St, London"),
        Activity(id="london-13", name="Sky Garden", activity_type=ActivityType.ATTRACTION, latitude=51.5113, longitude=-0.0836, review_score=4.4, review_count=56432, review_source="google", estimated_cost=0, estimated_minutes=60, address="20 Fenchurch St, London"),
        Activity(id="london-14", name="Camden Market", activity_type=ActivityType.SHOPPING, latitude=51.5413, longitude=-0.1466, review_score=4.3, review_count=98321, review_source="google", estimated_cost=25, estimated_minutes=120, address="Camden Lock Place, London"),
        Activity(id="london-15", name="West End Show", activity_type=ActivityType.ENTERTAINMENT, latitude=51.5115, longitude=-0.1281, review_score=4.6, review_count=45231, review_source="google", estimated_cost=60, estimated_minutes=150, address="West End, London"),
    ],
    "barcelona": [
        Activity(id="barcelona-1", name="Sagrada Familia", activity_type=ActivityType.ATTRACTION, latitude=41.4036, longitude=2.1744, review_score=4.8, review_count=267891, review_source="google", estimated_cost=26, estimated_minutes=120, address="C/ de Mallorca 401, Barcelona"),
        Activity(id="barcelona-2", name="Park Guell", activity_type=ActivityType.ATTRACTION, latitude=41.4145, longitude=2.1527, review_score=4.5, review_count=178432, review_source="google", estimated_cost=10, estimated_minutes=90, address="Carrer d'Olot, Barcelona"),
        Activity(id="barcelona-3", name="La Rambla Walk", activity_type=ActivityType.ATTRACTION, latitude=41.3818, longitude=2.1700, review_score=4.3, review_count=198234, review_source="google", estimated_cost=0, estimated_minutes=60, address="La Rambla, Barcelona"),
        Activity(id="barcelona-4", name="Gothic Quarter", activity_type=ActivityType.ATTRACTION, latitude=41.3833, longitude=2.1767, review_score=4.6, review_count=134231, review_source="google", estimated_cost=0, estimated_minutes=90, address="Barri Gotic, Barcelona"),
        Activity(id="barcelona-5", name="Casa Batllo", activity_type=ActivityType.ATTRACTION, latitude=41.3916, longitude=2.1650, review_score=4.6, review_count=89432, review_source="google", estimated_cost=35, estimated_minutes=90, address="Passeig de Gracia 43, Barcelona"),
        Activity(id="barcelona-6", name="La Boqueria Market", activity_type=ActivityType.SHOPPING, latitude=41.3816, longitude=2.1719, review_score=4.4, review_count=112453, review_source="google", estimated_cost=15, estimated_minutes=60, address="La Rambla 91, Barcelona"),
        Activity(id="barcelona-7", name="Barceloneta Beach", activity_type=ActivityType.ATTRACTION, latitude=41.3784, longitude=2.1925, review_score=4.4, review_count=87654, review_source="google", estimated_cost=0, estimated_minutes=120, address="Barceloneta, Barcelona"),
        Activity(id="barcelona-8", name="Picasso Museum", activity_type=ActivityType.ATTRACTION, latitude=41.3853, longitude=2.1810, review_score=4.4, review_count=67843, review_source="google", estimated_cost=12, estimated_minutes=90, address="Carrer de Montcada 15, Barcelona"),
        Activity(id="barcelona-9", name="Cal Pep", activity_type=ActivityType.RESTAURANT, latitude=41.3834, longitude=2.1821, review_score=4.5, review_count=8923, review_source="google", estimated_cost=35, estimated_minutes=75, address="Placa de les Olles 8, Barcelona"),
        Activity(id="barcelona-10", name="Cerveceria Catalana", activity_type=ActivityType.RESTAURANT, latitude=41.3934, longitude=2.1600, review_score=4.4, review_count=15672, review_source="google", estimated_cost=25, estimated_minutes=75, address="Carrer de Mallorca 236, Barcelona"),
        Activity(id="barcelona-11", name="Bar Canalete Tapas", activity_type=ActivityType.RESTAURANT, latitude=41.3870, longitude=2.1690, review_score=4.3, review_count=6781, review_source="google", estimated_cost=18, estimated_minutes=60, address="El Born, Barcelona"),
        Activity(id="barcelona-12", name="Satan's Coffee Corner", activity_type=ActivityType.CAFE, latitude=41.3845, longitude=2.1780, review_score=4.5, review_count=4531, review_source="google", estimated_cost=5, estimated_minutes=30, address="Carrer de l'Arc de Sant Ramon del Call, Barcelona"),
        Activity(id="barcelona-13", name="Montjuic Castle", activity_type=ActivityType.ATTRACTION, latitude=41.3636, longitude=2.1662, review_score=4.4, review_count=45231, review_source="google", estimated_cost=9, estimated_minutes=90, address="Ctra. de Montjuic, Barcelona"),
        Activity(id="barcelona-14", name="Flamenco Show", activity_type=ActivityType.ENTERTAINMENT, latitude=41.3830, longitude=2.1760, review_score=4.5, review_count=21342, review_source="google", estimated_cost=40, estimated_minutes=90, address="Placa Reial, Barcelona"),
        Activity(id="barcelona-15", name="Bunkers del Carmel", activity_type=ActivityType.ATTRACTION, latitude=41.4189, longitude=2.1594, review_score=4.6, review_count=34521, review_source="google", estimated_cost=0, estimated_minutes=60, address="Carrer de Mariana Laverna, Barcelona"),
    ],
    "bangkok": [
        Activity(id="bangkok-1", name="Grand Palace", activity_type=ActivityType.ATTRACTION, latitude=13.7500, longitude=100.4914, review_score=4.6, review_count=198234, review_source="google", estimated_cost=15, estimated_minutes=150, address="Na Phra Lan Rd, Bangkok"),
        Activity(id="bangkok-2", name="Wat Arun", activity_type=ActivityType.ATTRACTION, latitude=13.7437, longitude=100.4888, review_score=4.6, review_count=134231, review_source="google", estimated_cost=3, estimated_minutes=60, address="158 Thanon Wang Doem, Bangkok"),
        Activity(id="bangkok-3", name="Wat Pho", activity_type=ActivityType.ATTRACTION, latitude=13.7465, longitude=100.4930, review_score=4.6, review_count=112453, review_source="google", estimated_cost=5, estimated_minutes=90, address="2 Sanam Chai Rd, Bangkok"),
        Activity(id="bangkok-4", name="Chatuchak Weekend Market", activity_type=ActivityType.SHOPPING, latitude=13.7999, longitude=100.5504, review_score=4.5, review_count=167432, review_source="google", estimated_cost=20, estimated_minutes=180, address="Chatuchak, Bangkok"),
        Activity(id="bangkok-5", name="Khao San Road", activity_type=ActivityType.ENTERTAINMENT, latitude=13.7589, longitude=100.4971, review_score=4.1, review_count=87654, review_source="google", estimated_cost=15, estimated_minutes=90, address="Khao San Rd, Bangkok"),
        Activity(id="bangkok-6", name="Jim Thompson House", activity_type=ActivityType.ATTRACTION, latitude=13.7485, longitude=100.5293, review_score=4.5, review_count=34521, review_source="google", estimated_cost=6, estimated_minutes=60, address="6 Soi Kasemsan 2, Bangkok"),
        Activity(id="bangkok-7", name="Chinatown (Yaowarat)", activity_type=ActivityType.ATTRACTION, latitude=13.7410, longitude=100.5095, review_score=4.4, review_count=56432, review_source="google", estimated_cost=0, estimated_minutes=90, address="Yaowarat Rd, Bangkok"),
        Activity(id="bangkok-8", name="Wat Saket (Golden Mount)", activity_type=ActivityType.ATTRACTION, latitude=13.7536, longitude=100.5078, review_score=4.5, review_count=45231, review_source="google", estimated_cost=2, estimated_minutes=60, address="344 Chakkraphat Diphong Rd, Bangkok"),
        Activity(id="bangkok-9", name="Jay Fai", activity_type=ActivityType.RESTAURANT, latitude=13.7528, longitude=100.5052, review_score=4.4, review_count=12341, review_source="google", estimated_cost=25, estimated_minutes=60, address="327 Maha Chai Rd, Bangkok"),
        Activity(id="bangkok-10", name="Pad Thai Thip Samai", activity_type=ActivityType.RESTAURANT, latitude=13.7524, longitude=100.5060, review_score=4.5, review_count=23451, review_source="google", estimated_cost=4, estimated_minutes=30, address="313 Maha Chai Rd, Bangkok"),
        Activity(id="bangkok-11", name="Som Tam Nua", activity_type=ActivityType.RESTAURANT, latitude=13.7459, longitude=100.5393, review_score=4.3, review_count=8923, review_source="google", estimated_cost=6, estimated_minutes=45, address="392/14 Siam Square Soi 5, Bangkok"),
        Activity(id="bangkok-12", name="Raan Jay Fai Street Stall", activity_type=ActivityType.RESTAURANT, latitude=13.7530, longitude=100.5047, review_score=4.3, review_count=6781, review_source="google", estimated_cost=3, estimated_minutes=20, address="Old Town, Bangkok"),
        Activity(id="bangkok-13", name="Cafe Velodome", activity_type=ActivityType.CAFE, latitude=13.7502, longitude=100.5013, review_score=4.4, review_count=4531, review_source="google", estimated_cost=4, estimated_minutes=30, address="Phra Nakhon, Bangkok"),
        Activity(id="bangkok-14", name="Asiatique Night Market", activity_type=ActivityType.SHOPPING, latitude=13.7059, longitude=100.5018, review_score=4.3, review_count=67843, review_source="google", estimated_cost=15, estimated_minutes=120, address="2194 Charoen Krung Rd, Bangkok"),
        Activity(id="bangkok-15", name="Muay Thai Live Show", activity_type=ActivityType.ENTERTAINMENT, latitude=13.7060, longitude=100.5020, review_score=4.4, review_count=15672, review_source="google", estimated_cost=20, estimated_minutes=90, address="Asiatique, Bangkok"),
    ],
    "new york": [
        Activity(id="nyc-1", name="Statue of Liberty", activity_type=ActivityType.ATTRACTION, latitude=40.6892, longitude=-74.0445, review_score=4.7, review_count=267891, review_source="google", estimated_cost=24, estimated_minutes=180, address="Liberty Island, New York"),
        Activity(id="nyc-2", name="Central Park", activity_type=ActivityType.ATTRACTION, latitude=40.7829, longitude=-73.9654, review_score=4.8, review_count=298432, review_source="google", estimated_cost=0, estimated_minutes=120, address="Central Park, New York"),
        Activity(id="nyc-3", name="Metropolitan Museum of Art", activity_type=ActivityType.ATTRACTION, latitude=40.7794, longitude=-73.9632, review_score=4.8, review_count=189432, review_source="google", estimated_cost=30, estimated_minutes=180, address="1000 5th Ave, New York"),
        Activity(id="nyc-4", name="Times Square", activity_type=ActivityType.ATTRACTION, latitude=40.7580, longitude=-73.9855, review_score=4.4, review_count=234561, review_source="google", estimated_cost=0, estimated_minutes=45, address="Times Square, New York"),
        Activity(id="nyc-5", name="Brooklyn Bridge Walk", activity_type=ActivityType.ATTRACTION, latitude=40.7061, longitude=-73.9969, review_score=4.7, review_count=145231, review_source="google", estimated_cost=0, estimated_minutes=60, address="Brooklyn Bridge, New York"),
        Activity(id="nyc-6", name="Top of the Rock", activity_type=ActivityType.ATTRACTION, latitude=40.7593, longitude=-73.9794, review_score=4.7, review_count=98321, review_source="google", estimated_cost=40, estimated_minutes=60, address="30 Rockefeller Plaza, New York"),
        Activity(id="nyc-7", name="High Line Park", activity_type=ActivityType.ATTRACTION, latitude=40.7480, longitude=-74.0048, review_score=4.6, review_count=112453, review_source="google", estimated_cost=0, estimated_minutes=60, address="High Line, New York"),
        Activity(id="nyc-8", name="9/11 Memorial Museum", activity_type=ActivityType.ATTRACTION, latitude=40.7115, longitude=-74.0134, review_score=4.8, review_count=78432, review_source="google", estimated_cost=26, estimated_minutes=120, address="180 Greenwich St, New York"),
        Activity(id="nyc-9", name="Joe's Pizza", activity_type=ActivityType.RESTAURANT, latitude=40.7306, longitude=-74.0021, review_score=4.5, review_count=23451, review_source="google", estimated_cost=8, estimated_minutes=20, address="7 Carmine St, New York"),
        Activity(id="nyc-10", name="Peter Luger Steak House", activity_type=ActivityType.RESTAURANT, latitude=40.7099, longitude=-73.9625, review_score=4.4, review_count=15672, review_source="google", estimated_cost=60, estimated_minutes=90, address="178 Broadway, Brooklyn"),
        Activity(id="nyc-11", name="Xi'an Famous Foods", activity_type=ActivityType.RESTAURANT, latitude=40.7434, longitude=-73.9931, review_score=4.4, review_count=8923, review_source="google", estimated_cost=12, estimated_minutes=30, address="34 W 14th St, New York"),
        Activity(id="nyc-12", name="Los Tacos No. 1", activity_type=ActivityType.RESTAURANT, latitude=40.7424, longitude=-74.0060, review_score=4.5, review_count=12341, review_source="google", estimated_cost=10, estimated_minutes=20, address="Chelsea Market, New York"),
        Activity(id="nyc-13", name="Devocion Coffee", activity_type=ActivityType.CAFE, latitude=40.7149, longitude=-73.9612, review_score=4.5, review_count=4531, review_source="google", estimated_cost=6, estimated_minutes=30, address="69 Grand St, Brooklyn"),
        Activity(id="nyc-14", name="Chelsea Market", activity_type=ActivityType.SHOPPING, latitude=40.7424, longitude=-74.0061, review_score=4.5, review_count=67843, review_source="google", estimated_cost=20, estimated_minutes=90, address="75 9th Ave, New York"),
        Activity(id="nyc-15", name="Broadway Show", activity_type=ActivityType.ENTERTAINMENT, latitude=40.7590, longitude=-73.9845, review_score=4.7, review_count=134231, review_source="google", estimated_cost=80, estimated_minutes=150, address="Broadway, New York"),
    ],
    "istanbul": [
        Activity(id="istanbul-1", name="Hagia Sophia", activity_type=ActivityType.ATTRACTION, latitude=41.0086, longitude=28.9802, review_score=4.8, review_count=198234, review_source="google", estimated_cost=25, estimated_minutes=90, address="Sultan Ahmet, Istanbul"),
        Activity(id="istanbul-2", name="Blue Mosque", activity_type=ActivityType.ATTRACTION, latitude=41.0054, longitude=28.9768, review_score=4.7, review_count=167432, review_source="google", estimated_cost=0, estimated_minutes=45, address="Sultan Ahmet, Istanbul"),
        Activity(id="istanbul-3", name="Topkapi Palace", activity_type=ActivityType.ATTRACTION, latitude=41.0115, longitude=28.9834, review_score=4.6, review_count=134231, review_source="google", estimated_cost=20, estimated_minutes=150, address="Cankurtaran, Istanbul"),
        Activity(id="istanbul-4", name="Grand Bazaar", activity_type=ActivityType.SHOPPING, latitude=41.0107, longitude=28.9681, review_score=4.4, review_count=189432, review_source="google", estimated_cost=25, estimated_minutes=120, address="Beyazit, Istanbul"),
        Activity(id="istanbul-5", name="Basilica Cistern", activity_type=ActivityType.ATTRACTION, latitude=41.0084, longitude=28.9779, review_score=4.6, review_count=89432, review_source="google", estimated_cost=12, estimated_minutes=45, address="Alemdar, Istanbul"),
        Activity(id="istanbul-6", name="Galata Tower", activity_type=ActivityType.ATTRACTION, latitude=41.0256, longitude=28.9741, review_score=4.4, review_count=112453, review_source="google", estimated_cost=10, estimated_minutes=45, address="Bereketzade, Istanbul"),
        Activity(id="istanbul-7", name="Spice Bazaar", activity_type=ActivityType.SHOPPING, latitude=41.0169, longitude=28.9706, review_score=4.4, review_count=67843, review_source="google", estimated_cost=15, estimated_minutes=60, address="Eminonu, Istanbul"),
        Activity(id="istanbul-8", name="Bosphorus Cruise", activity_type=ActivityType.ATTRACTION, latitude=41.0178, longitude=28.9756, review_score=4.5, review_count=78432, review_source="google", estimated_cost=8, estimated_minutes=90, address="Eminonu Ferry Terminal, Istanbul"),
        Activity(id="istanbul-9", name="Karakoy Lokantasi", activity_type=ActivityType.RESTAURANT, latitude=41.0225, longitude=28.9770, review_score=4.4, review_count=8923, review_source="google", estimated_cost=15, estimated_minutes=60, address="Kemankes, Karakoy, Istanbul"),
        Activity(id="istanbul-10", name="Ciya Sofrasi", activity_type=ActivityType.RESTAURANT, latitude=41.0237, longitude=29.0232, review_score=4.5, review_count=12341, review_source="google", estimated_cost=12, estimated_minutes=60, address="Caferaga, Kadikoy, Istanbul"),
        Activity(id="istanbul-11", name="Hafiz Mustafa 1864", activity_type=ActivityType.CAFE, latitude=41.0109, longitude=28.9775, review_score=4.5, review_count=23451, review_source="google", estimated_cost=8, estimated_minutes=30, address="Hobyar, Eminonu, Istanbul"),
        Activity(id="istanbul-12", name="Kebapci Iskender", activity_type=ActivityType.RESTAURANT, latitude=41.0116, longitude=28.9690, review_score=4.3, review_count=6781, review_source="google", estimated_cost=10, estimated_minutes=45, address="Beyazit, Istanbul"),
        Activity(id="istanbul-13", name="Suleymaniye Mosque", activity_type=ActivityType.ATTRACTION, latitude=41.0162, longitude=28.9641, review_score=4.7, review_count=56432, review_source="google", estimated_cost=0, estimated_minutes=45, address="Suleymaniye, Istanbul"),
        Activity(id="istanbul-14", name="Istiklal Avenue Walk", activity_type=ActivityType.ATTRACTION, latitude=41.0338, longitude=28.9770, review_score=4.3, review_count=98321, review_source="google", estimated_cost=0, estimated_minutes=60, address="Istiklal Cd, Istanbul"),
        Activity(id="istanbul-15", name="Turkish Bath (Cemberlitas)", activity_type=ActivityType.ENTERTAINMENT, latitude=41.0085, longitude=28.9716, review_score=4.4, review_count=15672, review_source="google", estimated_cost=35, estimated_minutes=90, address="Vezirhan Cd, Istanbul"),
    ],
}


# Display names and countries for the demo cities, so the app can
# tell the user which places it knows about without a Google key.
DEMO_CITY_INFO: dict[str, dict[str, str]] = {
    "rome": {"city": "Rome", "country": "Italy"},
    "tokyo": {"city": "Tokyo", "country": "Japan"},
    "paris": {"city": "Paris", "country": "France"},
    "xian": {"city": "Xi'an", "country": "China"},
    "london": {"city": "London", "country": "United Kingdom"},
    "barcelona": {"city": "Barcelona", "country": "Spain"},
    "bangkok": {"city": "Bangkok", "country": "Thailand"},
    "new york": {"city": "New York", "country": "United States"},
    "istanbul": {"city": "Istanbul", "country": "Türkiye"},
}


def demo_cities() -> list[dict[str, str]]:
    """The cities demo mode can plan for, in a display-ready form."""
    return [
        DEMO_CITY_INFO.get(key, {"city": key.title(), "country": ""})
        for key in DEMO_CITIES
    ]


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
