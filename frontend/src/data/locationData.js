// ─── Country dial codes ──────────────────────────────────────────────────────
export const COUNTRY_DIAL_CODES = {
  'India': '+91',
  'USA': '+1',
  'UK': '+44',
  'Canada': '+1',
  'Australia': '+61',
  'Germany': '+49',
  'France': '+33',
  'UAE': '+971',
  'Saudi Arabia': '+966',
  'Singapore': '+65',
  'Sri Lanka': '+94',
  'Nepal': '+977',
  'Bangladesh': '+880',
  'Pakistan': '+92',
  'China': '+86',
  'Japan': '+81',
  'South Korea': '+82',
  'Brazil': '+55',
  'South Africa': '+27',
  'Nigeria': '+234',
  'Kenya': '+254',
  'Other': '',
}

// ─── Country → States ─────────────────────────────────────────────────────────
export const COUNTRY_STATES = {
  'India': [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
    'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
    'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
    'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
    'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
    'Andaman and Nicobar Islands','Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
  ],
  'USA': [
    'Alabama','Alaska','Arizona','Arkansas','California','Colorado',
    'Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho',
    'Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana',
    'Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
    'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
    'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma',
    'Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
    'Tennessee','Texas','Utah','Vermont','Virginia','Washington',
    'West Virginia','Wisconsin','Wyoming',
  ],
  'UK': ['England','Scotland','Wales','Northern Ireland'],
  'Canada': [
    'Alberta','British Columbia','Manitoba','New Brunswick',
    'Newfoundland and Labrador','Northwest Territories','Nova Scotia',
    'Nunavut','Ontario','Prince Edward Island','Quebec','Saskatchewan','Yukon',
  ],
  'Australia': [
    'Australian Capital Territory','New South Wales','Northern Territory',
    'Queensland','South Australia','Tasmania','Victoria','Western Australia',
  ],
  'Germany': [
    'Baden-Württemberg','Bavaria','Berlin','Brandenburg','Bremen',
    'Hamburg','Hesse','Lower Saxony','Mecklenburg-Vorpommern',
    'North Rhine-Westphalia','Rhineland-Palatinate','Saarland','Saxony',
    'Saxony-Anhalt','Schleswig-Holstein','Thuringia',
  ],
  'UAE': ['Abu Dhabi','Dubai','Sharjah','Ajman','Umm Al Quwain','Fujairah','Ras Al Khaimah'],
  'Saudi Arabia': [
    'Riyadh','Makkah','Medina','Eastern Province','Asir','Jizan','Najran',
    'Al Bahah','Northern Borders','Jouf','Hail','Qassim','Tabuk',
  ],
  'Singapore': ['Central Region','North Region','North-East Region','East Region','West Region'],
  'Sri Lanka': [
    'Central','Eastern','North Central','Northern','North Western',
    'Sabaragamuwa','Southern','Uva','Western',
  ],
  'Other': [],
}

// ─── State → Cities ───────────────────────────────────────────────────────────
export const STATE_CITIES = {
  'Tamil Nadu': [
    'Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem',
    'Tirunelveli','Vellore','Erode','Thoothukudi','Dindigul',
    'Thanjavur','Ranipet','Sivakasi','Karur','Udhagamandalam',
    'Hosur','Nagercoil','Kanchipuram','Kumarapalayam','Karaikkudi',
    'Neyveli','Cuddalore','Kumbakonam','Tiruvannamalai','Pollachi',
    'Rajapalayam','Gudiyatham','Pudukkottai','Vaniyambadi','Ambur',
    'Nagapattinam','Villupuram','Ariyalur','Perambalur','Krishnagiri',
    'Dharmapuri','Namakkal','Tirupur','Virudhunagar','Sivaganga',
    'Theni','Ramanathapuram','Tenkasi','Chengalpattu','Kallakurichi',
    'Tirupattur','Mayiladuthurai',
  ],
  'Karnataka': [
    'Bengaluru','Mysuru','Mangaluru','Hubballi','Belagavi','Kalaburagi',
    'Ballari','Vijayapura','Shivamogga','Tumakuru','Raichur','Bidar',
    'Davangere','Hassan','Udupi','Chikkamagaluru','Chitradurga','Dharwad',
    'Gadag','Haveri','Koppal','Kodagu','Mandya','Chamarajanagar','Yadgir',
    'Bengaluru Rural','Ramanagara','Chikkaballapura','Kolar','Bagalkot',
  ],
  'Maharashtra': [
    'Mumbai','Pune','Nagpur','Thane','Nashik','Aurangabad','Solapur',
    'Amravati','Kolhapur','Satara','Latur','Akola','Nanded','Sangli',
    'Ahmednagar','Jalgaon','Dhule','Beed','Osmanabad','Nandurbar',
    'Washim','Yavatmal','Chandrapur','Gadchiroli','Gondiya','Bhandara',
    'Wardha','Hingoli','Parbhani','Jalna','Buldhana','Ratnagiri',
    'Sindhudurg','Raigad',
  ],
  'Kerala': [
    'Thiruvananthapuram','Ernakulam','Kozhikode','Thrissur','Kollam',
    'Palakkad','Alappuzha','Malappuram','Kottayam','Kannur',
    'Kasaragod','Pathanamthitta','Idukki','Wayanad',
  ],
  'Andhra Pradesh': [
    'Visakhapatnam','Vijayawada','Tirupati','Guntur','Kurnool','Nellore',
    'Rajahmundry','Kakinada','Kadapa','Anantapur','Eluru','Ongole',
    'Vizianagaram','Srikakulam','Chittoor','Prakasam','Krishna',
    'West Godavari','East Godavari',
  ],
  'Telangana': [
    'Hyderabad','Warangal','Nizamabad','Khammam','Karimnagar','Ramagundam',
    'Mahbubnagar','Nalgonda','Adilabad','Suryapet','Siddipet','Jagitial',
    'Mancherial','Nirmal','Kamareddy','Rajanna Sircilla','Medak',
    'Sangareddy','Vikarabad','Yadadri Bhuvanagiri',
  ],
  'Gujarat': [
    'Ahmedabad','Surat','Vadodara','Rajkot','Bhavnagar','Jamnagar',
    'Junagadh','Gandhinagar','Anand','Navsari','Morbi','Surendranagar',
    'Amreli','Valsad','Mehsana','Patan','Banaskantha','Sabarkantha',
    'Arvalli','Kheda','Panchmahal','Dahod','Narmada','Bharuch',
    'Tapi','Dang','Botad','Devbhoomi Dwarka','Gir Somnath','Porbandar','Kutch',
  ],
  'Uttar Pradesh': [
    'Lucknow','Kanpur','Agra','Varanasi','Prayagraj','Meerut',
    'Noida','Ghaziabad','Moradabad','Mathura','Bareilly','Aligarh',
    'Gorakhpur','Firozabad','Jhansi','Muzaffarnagar','Saharanpur',
    'Hapur','Rampur','Shahjahanpur','Amroha','Bulandshahr','Sambhal',
    'Bijnaur','Sitapur','Lakhimpur Kheri','Faizabad','Hardoi','Etawah',
  ],
  'Rajasthan': [
    'Jaipur','Jodhpur','Kota','Bikaner','Ajmer','Udaipur','Bhilwara',
    'Sikar','Sri Ganganagar','Pali','Alwar','Bharatpur','Barmer',
    'Jaisalmer','Nagaur','Hanumangarh','Jhunjhunu','Churu','Dausa',
    'Sawai Madhopur','Karauli','Dholpur','Bundi','Tonk','Baran',
  ],
  'West Bengal': [
    'Kolkata','Asansol','Siliguri','Durgapur','Bardhaman','Malda',
    'Baharampur','Habra','Raiganj','Santipur','Darjeeling','Jalpaiguri',
    'Cooch Behar','Bankura','Birbhum','Hooghly','Nadia','Murshidabad',
    'North 24 Parganas','South 24 Parganas','Purulia',
    'Paschim Medinipur','Purba Medinipur',
  ],
  'Madhya Pradesh': [
    'Bhopal','Indore','Gwalior','Jabalpur','Ujjain','Sagar','Ratlam',
    'Satna','Chhindwara','Rewa','Murwara','Singrauli','Burhanpur',
    'Khandwa','Bhind','Shivpuri','Vidisha','Morena','Chhatarpur',
    'Dewas','Hoshangabad','Damoh','Mandsaur','Datia',
  ],
  'Punjab': [
    'Ludhiana','Amritsar','Jalandhar','Patiala','Bathinda','Hoshiarpur',
    'Moga','Pathankot','Batala','Gurdaspur','Abohar','Malout',
    'Fazilka','Muktsar','Faridkot','Firozpur','Kapurthala','Nawanshahr',
    'Tarn Taran','Rupnagar','Mohali (SAS Nagar)','Sangrur','Barnala','Mansa',
  ],
  'Haryana': [
    'Faridabad','Gurugram','Panipat','Ambala','Yamunanagar','Rohtak',
    'Hisar','Karnal','Sonipat','Panchkula','Bhiwani','Sirsa',
    'Bahadurgarh','Jind','Thanesar','Kaithal','Rewari','Palwal',
    'Fatehabad','Mewat (Nuh)','Mahendragarh','Jhajjar','Charkhi Dadri',
  ],
  'Delhi': [
    'New Delhi','North Delhi','South Delhi','East Delhi','West Delhi',
    'North West Delhi','North East Delhi','South East Delhi',
    'South West Delhi','Central Delhi','Shahdara','Dwarka',
  ],
  'Bihar': [
    'Patna','Gaya','Muzaffarpur','Bhagalpur','Darbhanga','Purnia',
    'Ara','Bihar Sharif','Begusarai','Katihar','Munger','Chapra',
    'Motihari','Sitamarhi','Samastipur','Hajipur','Siwan','Bettiah',
    'Aurangabad','Nawada','Saharsa','Supaul','Madhubani','Nalanda',
  ],
  'Odisha': [
    'Bhubaneswar','Cuttack','Rourkela','Brahmapur','Sambalpur',
    'Puri','Balasore','Baripada','Bhadrak','Jharsuguda','Angul',
    'Dhenkanal','Kendujhar','Mayurbhanj','Ganjam','Gajapati',
    'Rayagada','Koraput','Malkangiri','Nabarangapur','Kalahandi','Bolangir',
  ],
  'Assam': [
    'Guwahati','Silchar','Dibrugarh','Jorhat','Nagaon','Tinsukia',
    'Tezpur','Bongaigaon','Dhubri','North Lakhimpur','Sibsagar',
    'Goalpara','Barpeta','Kamrup','Sonitpur',
  ],
  'Jharkhand': [
    'Ranchi','Jamshedpur','Dhanbad','Bokaro','Deoghar','Phusro',
    'Hazaribagh','Giridih','Ramgarh','Medininagar','Chatra','Lohardaga',
    'Dumka','Pakur','Godda','Sahebganj','Jamtara','Simdega','Khunti',
  ],
  'Chhattisgarh': [
    'Raipur','Bhilai','Bilaspur','Korba','Rajnandgaon','Jagdalpur',
    'Raigarh','Ambikapur','Durg','Dhamtari','Mahasamund','Bemetara',
    'Kondagaon','Narayanpur','Bastar','Kanker','Kabirdham',
  ],
  'Himachal Pradesh': [
    'Shimla','Dharamsala','Solan','Mandi','Palampur','Baddi',
    'Nahan','Sundarnagar','Paonta Sahib','Una','Kullu','Chamba','Hamirpur','Bilaspur',
  ],
  'Uttarakhand': [
    'Dehradun','Haridwar','Roorkee','Haldwani','Rudrapur','Kashipur',
    'Rishikesh','Nainital','Mussoorie','Kotdwar','Pithoragarh','Almora',
    'Uttarkashi','Tehri','Chamoli','Rudraprayag','Champawat','Bageshwar',
  ],
  'Goa': ['Panaji','Margao','Vasco da Gama','Mapusa','Ponda','Bicholim','Canacona'],
  'Jammu and Kashmir': [
    'Srinagar','Jammu','Anantnag','Baramulla','Kupwara','Pulwama',
    'Shopian','Kulgam','Ganderbal','Budgam','Bandipora','Poonch',
    'Rajouri','Kathua','Udhampur','Reasi','Ramban','Doda','Kishtwar','Samba',
  ],
  'Puducherry': ['Puducherry','Karaikal','Mahe','Yanam'],
  'Chandigarh': ['Chandigarh'],
  // USA
  'California': ['Los Angeles','San Francisco','San Diego','San Jose','Sacramento','Fresno','Oakland'],
  'Texas': ['Houston','San Antonio','Dallas','Austin','Fort Worth','El Paso','Arlington'],
  'New York': ['New York City','Buffalo','Rochester','Yonkers','Syracuse','Albany'],
  'Florida': ['Jacksonville','Miami','Tampa','Orlando','St. Petersburg','Tallahassee'],
  'Illinois': ['Chicago','Aurora','Joliet','Naperville','Rockford','Springfield'],
  // UK
  'England': ['London','Birmingham','Leeds','Sheffield','Bradford','Liverpool','Manchester','Bristol','Coventry','Leicester'],
  'Scotland': ['Edinburgh','Glasgow','Aberdeen','Dundee','Inverness'],
  'Wales': ['Cardiff','Swansea','Newport','Bangor','St Davids'],
  'Northern Ireland': ['Belfast','Derry','Lisburn','Newry','Armagh'],
  // UAE
  'Abu Dhabi': ['Abu Dhabi City','Al Ain','Ruwais','Liwa'],
  'Dubai': ['Dubai City','Deira','Bur Dubai','Jumeirah','Marina'],
  'Sharjah': ['Sharjah City','Khor Fakkan','Kalba'],
}

// ─── Indian Pincode → { taluk, post, district } ───────────────────────────────
export const PINCODE_DATA = {
  // Chennai
  '600001': { taluk: 'Chennai', post: 'Chennai GPO', district: 'Chennai' },
  '600002': { taluk: 'Chennai', post: 'Park Town', district: 'Chennai' },
  '600004': { taluk: 'Chennai', post: 'Egmore', district: 'Chennai' },
  '600005': { taluk: 'Chennai', post: 'Thousand Lights', district: 'Chennai' },
  '600006': { taluk: 'Chennai', post: 'Chepauk', district: 'Chennai' },
  '600010': { taluk: 'Chennai', post: 'Royapettah', district: 'Chennai' },
  '600014': { taluk: 'Chennai', post: 'Alwarpet', district: 'Chennai' },
  '600017': { taluk: 'Chennai', post: 'Nandanam', district: 'Chennai' },
  '600018': { taluk: 'Chennai', post: 'Ashok Nagar', district: 'Chennai' },
  '600020': { taluk: 'Chennai', post: 'T. Nagar', district: 'Chennai' },
  '600024': { taluk: 'Chennai', post: 'Mylapore', district: 'Chennai' },
  '600028': { taluk: 'Chennai', post: 'Adyar', district: 'Chennai' },
  '600040': { taluk: 'Chennai', post: 'Anna Nagar', district: 'Chennai' },
  '600042': { taluk: 'Chennai', post: 'Villivakkam', district: 'Chennai' },
  '600050': { taluk: 'Chennai', post: 'Kodambakkam', district: 'Chennai' },
  '600073': { taluk: 'Chennai', post: 'Velachery', district: 'Chennai' },
  '600078': { taluk: 'Chennai', post: 'Perambur', district: 'Chennai' },
  '600080': { taluk: 'Tambaram', post: 'Tambaram', district: 'Chengalpattu' },
  '600091': { taluk: 'Tambaram', post: 'Chromepet', district: 'Chengalpattu' },
  '600096': { taluk: 'Tambaram', post: 'Pallavaram', district: 'Chengalpattu' },
  '600100': { taluk: 'Tambaram', post: 'Perungalathur', district: 'Chengalpattu' },
  '600116': { taluk: 'Tambaram', post: 'Medavakkam', district: 'Chengalpattu' },
  '600119': { taluk: 'Tambaram', post: 'Perungudi', district: 'Chengalpattu' },
  // Coimbatore
  '641001': { taluk: 'Coimbatore South', post: 'Coimbatore GPO', district: 'Coimbatore' },
  '641002': { taluk: 'Coimbatore South', post: 'Race Course', district: 'Coimbatore' },
  '641004': { taluk: 'Coimbatore North', post: 'Ganapathy', district: 'Coimbatore' },
  '641005': { taluk: 'Coimbatore North', post: 'Saibaba Colony', district: 'Coimbatore' },
  '641006': { taluk: 'Coimbatore North', post: 'Peelamedu', district: 'Coimbatore' },
  '641014': { taluk: 'Coimbatore South', post: 'Singanallur', district: 'Coimbatore' },
  '641018': { taluk: 'Coimbatore South', post: 'Ukkadam', district: 'Coimbatore' },
  '641025': { taluk: 'Coimbatore North', post: 'Vadavalli', district: 'Coimbatore' },
  '641035': { taluk: 'Coimbatore North', post: 'Kuniyamuthur', district: 'Coimbatore' },
  '641045': { taluk: 'Coimbatore North', post: 'Saravanampatty', district: 'Coimbatore' },
  // Madurai
  '625001': { taluk: 'Madurai South', post: 'Madurai GPO', district: 'Madurai' },
  '625002': { taluk: 'Madurai North', post: 'Anna Nagar Madurai', district: 'Madurai' },
  '625009': { taluk: 'Madurai South', post: 'Palanganatham', district: 'Madurai' },
  '625011': { taluk: 'Madurai South', post: 'KK Nagar Madurai', district: 'Madurai' },
  '625016': { taluk: 'Madurai South', post: 'Teppakulam', district: 'Madurai' },
  '625020': { taluk: 'Madurai North', post: 'Arasaradi', district: 'Madurai' },
  // Trichy
  '620001': { taluk: 'Tiruchirappalli', post: 'Trichy GPO', district: 'Tiruchirappalli' },
  '620002': { taluk: 'Tiruchirappalli', post: 'Cantonment', district: 'Tiruchirappalli' },
  '620003': { taluk: 'Tiruchirappalli', post: 'Karumandapam', district: 'Tiruchirappalli' },
  '620018': { taluk: 'Tiruchirappalli', post: 'Palpannai', district: 'Tiruchirappalli' },
  '620020': { taluk: 'Tiruchirappalli', post: 'Thillai Nagar', district: 'Tiruchirappalli' },
  // Salem
  '636001': { taluk: 'Salem', post: 'Salem GPO', district: 'Salem' },
  '636007': { taluk: 'Salem', post: 'Alagapuram', district: 'Salem' },
  '636016': { taluk: 'Salem', post: 'Suramangalam', district: 'Salem' },
  // Vellore
  '632001': { taluk: 'Vellore', post: 'Vellore GPO', district: 'Vellore' },
  '632006': { taluk: 'Vellore', post: 'Katpadi', district: 'Vellore' },
  '632009': { taluk: 'Vellore', post: 'Sathuvachari', district: 'Vellore' },
  // Tirunelveli
  '627001': { taluk: 'Tirunelveli', post: 'Tirunelveli GPO', district: 'Tirunelveli' },
  '627005': { taluk: 'Tirunelveli', post: 'Palayamkottai', district: 'Tirunelveli' },
  '627007': { taluk: 'Tirunelveli', post: 'Vannarpettai', district: 'Tirunelveli' },
  // Erode
  '638001': { taluk: 'Erode', post: 'Erode GPO', district: 'Erode' },
  '638009': { taluk: 'Erode', post: 'Perundurai', district: 'Erode' },
  // Bengaluru
  '560001': { taluk: 'Bengaluru North', post: 'Bengaluru GPO', district: 'Bengaluru Urban' },
  '560002': { taluk: 'Bengaluru North', post: 'Shivajinagar', district: 'Bengaluru Urban' },
  '560003': { taluk: 'Bengaluru North', post: 'Cubbon Park', district: 'Bengaluru Urban' },
  '560004': { taluk: 'Bengaluru North', post: 'Vasanth Nagar', district: 'Bengaluru Urban' },
  '560005': { taluk: 'Bengaluru North', post: 'Rajajinagar', district: 'Bengaluru Urban' },
  '560011': { taluk: 'Bengaluru North', post: 'Malleswaram', district: 'Bengaluru Urban' },
  '560017': { taluk: 'Bengaluru North', post: 'Yeshwanthpur', district: 'Bengaluru Urban' },
  '560020': { taluk: 'Bengaluru South', post: 'Jayanagar', district: 'Bengaluru Urban' },
  '560030': { taluk: 'Bengaluru South', post: 'Basavanagudi', district: 'Bengaluru Urban' },
  '560034': { taluk: 'Bengaluru North', post: 'Indiranagar', district: 'Bengaluru Urban' },
  '560038': { taluk: 'Bengaluru South', post: 'Koramangala', district: 'Bengaluru Urban' },
  '560068': { taluk: 'Bengaluru North', post: 'Hebbal', district: 'Bengaluru Urban' },
  '560071': { taluk: 'Bengaluru North', post: 'Vijayanagar', district: 'Bengaluru Urban' },
  '560076': { taluk: 'Bengaluru North', post: 'Yelahanka', district: 'Bengaluru Urban' },
  '560095': { taluk: 'Bengaluru North', post: 'Whitefield', district: 'Bengaluru Urban' },
  '560100': { taluk: 'Bengaluru North', post: 'Electronic City', district: 'Bengaluru Urban' },
  // Mumbai
  '400001': { taluk: 'Mumbai City', post: 'Mumbai GPO', district: 'Mumbai City' },
  '400002': { taluk: 'Mumbai City', post: 'Kalbadevi', district: 'Mumbai City' },
  '400007': { taluk: 'Mumbai City', post: 'Byculla', district: 'Mumbai City' },
  '400012': { taluk: 'Mumbai City', post: 'Parel', district: 'Mumbai City' },
  '400016': { taluk: 'Mumbai City', post: 'Mahim', district: 'Mumbai City' },
  '400022': { taluk: 'Mumbai City', post: 'Sion', district: 'Mumbai City' },
  '400050': { taluk: 'Andheri', post: 'Bandra', district: 'Mumbai Suburban' },
  '400053': { taluk: 'Andheri', post: 'Andheri West', district: 'Mumbai Suburban' },
  '400058': { taluk: 'Andheri', post: 'Andheri East', district: 'Mumbai Suburban' },
  '400063': { taluk: 'Borivali', post: 'Malad West', district: 'Mumbai Suburban' },
  '400066': { taluk: 'Borivali', post: 'Kandivali West', district: 'Mumbai Suburban' },
  '400068': { taluk: 'Borivali', post: 'Borivali West', district: 'Mumbai Suburban' },
  '400092': { taluk: 'Kurla', post: 'Powai', district: 'Mumbai Suburban' },
  '400094': { taluk: 'Kurla', post: 'Mulund West', district: 'Mumbai Suburban' },
  // Pune
  '411001': { taluk: 'Pune City', post: 'Pune GPO', district: 'Pune' },
  '411004': { taluk: 'Pune City', post: 'Sadashiv Peth', district: 'Pune' },
  '411014': { taluk: 'Haveli', post: 'Wadgaon Sheri', district: 'Pune' },
  '411028': { taluk: 'Haveli', post: 'Kothrud', district: 'Pune' },
  '411038': { taluk: 'Haveli', post: 'Wakad', district: 'Pune' },
  '411041': { taluk: 'Haveli', post: 'Baner', district: 'Pune' },
  '411045': { taluk: 'Haveli', post: 'Aundh', district: 'Pune' },
  '411048': { taluk: 'Haveli', post: 'Pimple Saudagar', district: 'Pune' },
  // Delhi
  '110001': { taluk: 'Central Delhi', post: 'Connaught Place', district: 'Central Delhi' },
  '110003': { taluk: 'South Delhi', post: 'Lodi Colony', district: 'South Delhi' },
  '110005': { taluk: 'West Delhi', post: 'Patel Nagar', district: 'West Delhi' },
  '110006': { taluk: 'Central Delhi', post: 'Paharganj', district: 'Central Delhi' },
  '110016': { taluk: 'South Delhi', post: 'Hauz Khas', district: 'South Delhi' },
  '110019': { taluk: 'South Delhi', post: 'Kalkaji', district: 'South Delhi' },
  '110024': { taluk: 'South Delhi', post: 'Lajpat Nagar', district: 'South Delhi' },
  '110049': { taluk: 'South Delhi', post: 'Vasant Kunj', district: 'South Delhi' },
  '110051': { taluk: 'East Delhi', post: 'Shahdara', district: 'East Delhi' },
  '110059': { taluk: 'West Delhi', post: 'Janakpuri', district: 'West Delhi' },
  '110063': { taluk: 'South West Delhi', post: 'Dwarka Sector 6', district: 'South West Delhi' },
  '110075': { taluk: 'South West Delhi', post: 'Dwarka', district: 'South West Delhi' },
  '110085': { taluk: 'North West Delhi', post: 'Rohini', district: 'North West Delhi' },
  '110092': { taluk: 'North East Delhi', post: 'Vivek Vihar', district: 'North East Delhi' },
  // Hyderabad
  '500001': { taluk: 'Hyderabad', post: 'Hyderabad GPO', district: 'Hyderabad' },
  '500003': { taluk: 'Hyderabad', post: 'Abids', district: 'Hyderabad' },
  '500004': { taluk: 'Hyderabad', post: 'Nampally', district: 'Hyderabad' },
  '500008': { taluk: 'Hyderabad', post: 'Begumpet', district: 'Hyderabad' },
  '500016': { taluk: 'Hyderabad', post: 'Banjara Hills', district: 'Hyderabad' },
  '500032': { taluk: 'Hyderabad', post: 'Jubilee Hills', district: 'Hyderabad' },
  '500038': { taluk: 'Hyderabad', post: 'Kukatpally', district: 'Medchal-Malkajgiri' },
  '500072': { taluk: 'Hyderabad', post: 'Gachibowli', district: 'Hyderabad' },
  '500082': { taluk: 'Hyderabad', post: 'Kondapur', district: 'Hyderabad' },
  '500084': { taluk: 'Hyderabad', post: 'Manikonda', district: 'Hyderabad' },
}

/** Get states for a given country */
export function getStatesForCountry(country) {
  return COUNTRY_STATES[country] || []
}

/** Get cities for a given state */
export function getCitiesForState(state) {
  return STATE_CITIES[state] || []
}

/** Get dial code for a given country */
export function getDialCode(country) {
  return COUNTRY_DIAL_CODES[country] || ''
}

/** Look up pincode data — returns { taluk, post, district } or null */
export function lookupPincode(pincode) {
  const cleaned = (pincode || '').trim()
  return PINCODE_DATA[cleaned] || null
}

/**
 * Calculate age in years from a DOB string (YYYY-MM-DD).
 * Returns '' if invalid.
 */
export function calculateAge(dob) {
  if (!dob) return ''
  const today = new Date()
  const birth = new Date(dob)
  if (isNaN(birth.getTime())) return ''
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1
  return age >= 0 ? String(age) : ''
}

/** Calculate a human-readable age including years, months, and days. */
export function calculateAgeDetails(dob) {
  if (!dob) return { years: '', label: '' }
  const birth = new Date(`${dob}T00:00:00`)
  const today = new Date()
  if (Number.isNaN(birth.getTime()) || birth > today) return { years: '', label: '' }
  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  let days = today.getDate() - birth.getDate()
  if (days < 0) {
    months -= 1
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate()
  }
  if (months < 0) { years -= 1; months += 12 }
  return { years: String(Math.max(0, years)), label: `${Math.max(0, years)} years ${months} months ${days} days` }
}

export function postalCodeLength(country) {
  return ({
    India: 6, USA: 5, UK: 7, Canada: 6, Australia: 4, Germany: 5, France: 5,
    UAE: 5, 'Saudi Arabia': 5, Singapore: 6, 'Sri Lanka': 5, Nepal: 5,
    Bangladesh: 4, Pakistan: 5, China: 6, Japan: 7, 'South Korea': 5,
    Brazil: 8, 'South Africa': 4, Nigeria: 6, Kenya: 5,
  })[country] || 10
}

/** Expected local phone digits; the country calling code is displayed separately. */
export function phoneNumberLength(country) {
  return ({
    India: 10, USA: 10, UK: 10, Canada: 10, Australia: 9, Germany: 11, France: 9,
    UAE: 9, 'Saudi Arabia': 9, Singapore: 8, 'Sri Lanka': 9, Nepal: 10,
    Bangladesh: 10, Pakistan: 10, China: 11, Japan: 10, 'South Korea': 10,
    Brazil: 11, 'South Africa': 9, Nigeria: 10, Kenya: 9,
  })[country] || 15
}
