-- Sample data for Global Conflict Dashboard
-- Run this in Supabase SQL Editor after creating the schema

-- Insert sample conflicts
INSERT INTO conflicts (name, slug, description, type, status, intensity, start_date, latitude, longitude, region, countries_involved) VALUES
('Ukraine-Russia Conflict', 'ukraine-russia-conflict', 'Ongoing armed conflict between Russia and Ukraine that began in 2014 with the annexation of Crimea and escalated to a full-scale invasion in February 2022.', 'interstate', 'ongoing', 'high', '2014-02-20', 48.3794, 31.1656, 'europe', ARRAY['Ukraine', 'Russia']),
('Gaza-Israel Conflict', 'gaza-israel-conflict', 'Ongoing conflict between Israel and Palestinian militant groups in the Gaza Strip, with periodic escalations.', 'territorial_dispute', 'escalating', 'high', '2023-10-07', 31.3547, 34.3088, 'middle_east', ARRAY['Israel', 'Palestine']),
('Sudan Civil War', 'sudan-civil-war', 'Armed conflict between the Sudanese Armed Forces and the Rapid Support Forces that began in April 2023.', 'civil_war', 'ongoing', 'high', '2023-04-15', 15.5007, 32.5599, 'africa', ARRAY['Sudan']),
('Myanmar Internal Conflict', 'myanmar-internal-conflict', 'Ongoing civil war following the 2021 military coup, with multiple ethnic armed organizations resisting military rule.', 'civil_war', 'ongoing', 'medium', '2021-02-01', 21.9162, 95.9560, 'asia', ARRAY['Myanmar']),
('Yemen Civil War', 'yemen-civil-war', 'Protracted conflict between the internationally recognized government and Houthi rebels, with regional involvement.', 'civil_war', 'ongoing', 'high', '2014-09-21', 15.5527, 48.5164, 'middle_east', ARRAY['Yemen']),
('Syrian Civil War', 'syrian-civil-war', 'Multi-sided conflict involving the Syrian government, opposition groups, and international forces since 2011.', 'civil_war', 'ongoing', 'high', '2011-03-15', 34.8021, 38.9968, 'middle_east', ARRAY['Syria']),
('Sahel Insurgency', 'sahel-insurgency', 'Islamist insurgency in the Sahel region involving multiple militant groups and international peacekeeping forces.', 'insurgency', 'escalating', 'medium', '2012-01-01', 17.5707, -3.9962, 'africa', ARRAY['Mali', 'Burkina Faso', 'Niger']),
('Kashmir Dispute', 'kashmir-dispute', 'Territorial dispute between India and Pakistan over the Kashmir region, with periodic border clashes.', 'territorial_dispute', 'frozen', 'medium', '1947-10-22', 33.7782, 76.5762, 'asia', ARRAY['India', 'Pakistan']),
('Tigray Conflict', 'tigray-conflict', 'Conflict in the Tigray region of Ethiopia between government forces and the Tigray People''s Liberation Front.', 'civil_war', 'de-escalating', 'medium', '2020-11-03', 14.0323, 38.7469, 'africa', ARRAY['Ethiopia']),
('Haiti Gang Violence', 'haiti-gang-violence', 'Escalating gang violence and political instability in Haiti following the assassination of President Moïse.', 'insurgency', 'escalating', 'high', '2021-07-07', 18.9712, -72.2852, 'caribbean', ARRAY['Haiti']);

-- Insert sample parties
INSERT INTO parties (name, slug, type, description, country) VALUES
('Russian Armed Forces', 'russian-armed-forces', 'state', 'Official military forces of the Russian Federation', 'Russia'),
('Ukrainian Armed Forces', 'ukrainian-armed-forces', 'state', 'Official military forces of Ukraine', 'Ukraine'),
('Israeli Defense Forces', 'israeli-defense-forces', 'state', 'Military forces of the State of Israel', 'Israel'),
('Hamas', 'hamas', 'rebel_group', 'Palestinian Islamist political and militant organization', 'Palestine'),
('Sudanese Armed Forces', 'sudanese-armed-forces', 'state', 'Official military forces of Sudan', 'Sudan'),
('Rapid Support Forces', 'rapid-support-forces', 'militia', 'Paramilitary force in Sudan', 'Sudan'),
('Tatmadaw', 'tatmadaw', 'state', 'Military forces of Myanmar', 'Myanmar'),
('Kachin Independence Army', 'kachin-independence-army', 'rebel_group', 'Ethnic armed organization in Myanmar', 'Myanmar'),
('Houthi Movement', 'houthi-movement', 'rebel_group', 'Zaidi Shia political and military movement in Yemen', 'Yemen'),
('Syrian Arab Army', 'syrian-arab-army', 'state', 'Military forces of the Syrian government', 'Syria');

-- Link parties to conflicts
INSERT INTO conflict_parties (conflict_id, party_id, role) VALUES
((SELECT id FROM conflicts WHERE slug = 'ukraine-russia-conflict'), (SELECT id FROM parties WHERE slug = 'russian-armed-forces'), 'primary_belligerent'),
((SELECT id FROM conflicts WHERE slug = 'ukraine-russia-conflict'), (SELECT id FROM parties WHERE slug = 'ukrainian-armed-forces'), 'primary_belligerent'),
((SELECT id FROM conflicts WHERE slug = 'gaza-israel-conflict'), (SELECT id FROM parties WHERE slug = 'israeli-defense-forces'), 'primary_belligerent'),
((SELECT id FROM conflicts WHERE slug = 'gaza-israel-conflict'), (SELECT id FROM parties WHERE slug = 'hamas'), 'primary_belligerent'),
((SELECT id FROM conflicts WHERE slug = 'sudan-civil-war'), (SELECT id FROM parties WHERE slug = 'sudanese-armed-forces'), 'primary_belligerent'),
((SELECT id FROM conflicts WHERE slug = 'sudan-civil-war'), (SELECT id FROM parties WHERE slug = 'rapid-support-forces'), 'primary_belligerent'),
((SELECT id FROM conflicts WHERE slug = 'myanmar-internal-conflict'), (SELECT id FROM parties WHERE slug = 'tatmadaw'), 'primary_belligerent'),
((SELECT id FROM conflicts WHERE slug = 'myanmar-internal-conflict'), (SELECT id FROM parties WHERE slug = 'kachin-independence-army'), 'rebel_group'),
((SELECT id FROM conflicts WHERE slug = 'yemen-civil-war'), (SELECT id FROM parties WHERE slug = 'houthi-movement'), 'primary_belligerent'),
((SELECT id FROM conflicts WHERE slug = 'syrian-civil-war'), (SELECT id FROM parties WHERE slug = 'syrian-arab-army'), 'primary_belligerent');

-- Insert sample tags
INSERT INTO tags (name, slug, category) VALUES
('humanitarian', 'humanitarian', 'thematic'),
('resource-conflict', 'resource-conflict', 'thematic'),
('international-involvement', 'international-involvement', 'thematic'),
('ethnic-conflict', 'ethnic-conflict', 'thematic'),
('territorial-dispute', 'territorial-dispute', 'thematic'),
('civil-war', 'civil-war', 'type'),
('interstate', 'interstate', 'type'),
('insurgency', 'insurgency', 'type');

-- Link tags to conflicts
INSERT INTO conflict_tags (conflict_id, tag_id) VALUES
((SELECT id FROM conflicts WHERE slug = 'ukraine-russia-conflict'), (SELECT id FROM tags WHERE slug = 'international-involvement')),
((SELECT id FROM conflicts WHERE slug = 'ukraine-russia-conflict'), (SELECT id FROM tags WHERE slug = 'interstate')),
((SELECT id FROM conflicts WHERE slug = 'gaza-israel-conflict'), (SELECT id FROM tags WHERE slug = 'territorial-dispute')),
((SELECT id FROM conflicts WHERE slug = 'gaza-israel-conflict'), (SELECT id FROM tags WHERE slug = 'humanitarian')),
((SELECT id FROM conflicts WHERE slug = 'sudan-civil-war'), (SELECT id FROM tags WHERE slug = 'civil-war')),
((SELECT id FROM conflicts WHERE slug = 'sudan-civil-war'), (SELECT id FROM tags WHERE slug = 'humanitarian')),
((SELECT id FROM conflicts WHERE slug = 'myanmar-internal-conflict'), (SELECT id FROM tags WHERE slug = 'civil-war')),
((SELECT id FROM conflicts WHERE slug = 'myanmar-internal-conflict'), (SELECT id FROM tags WHERE slug = 'ethnic-conflict')),
((SELECT id FROM conflicts WHERE slug = 'yemen-civil-war'), (SELECT id FROM tags WHERE slug = 'civil-war')),
((SELECT id FROM conflicts WHERE slug = 'yemen-civil-war'), (SELECT id FROM tags WHERE slug = 'humanitarian'));

-- Insert sample news sources
INSERT INTO news_sources (name, url, type, region, language, active) VALUES
('Reuters', 'https://www.reuters.com/', 'rss', 'global', 'en', true),
('BBC World', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'rss', 'global', 'en', true),
('Al Jazeera', 'https://www.aljazeera.com/xml/rss/all.xml', 'rss', 'global', 'en', true),
('Associated Press', 'https://apnews.com/', 'rss', 'global', 'en', true),
('GDELT', 'https://api.gdeltproject.org/api/v2/', 'gdelt', 'global', 'en', true);

-- Insert sample news items
INSERT INTO news_items (conflict_id, headline, url, source, published_at, summary) VALUES
((SELECT id FROM conflicts WHERE slug = 'ukraine-russia-conflict'), 'Ukraine reports advances in eastern counteroffensive', 'https://example.com/ukraine-advance', 'Reuters', '2024-06-20 10:30:00', 'Ukrainian forces report territorial gains in eastern regions amid ongoing counteroffensive operations.'),
((SELECT id FROM conflicts WHERE slug = 'gaza-israel-conflict'), 'Ceasefire negotiations continue in Cairo', 'https://example.com/gaza-ceasefire', 'BBC World', '2024-06-20 08:15:00', 'International mediators meet in Cairo to discuss potential ceasefire framework for Gaza conflict.'),
((SELECT id FROM conflicts WHERE slug = 'sudan-civil-war'), 'Humanitarian corridor opens in Khartoum', 'https://example.com/sudan-corridor', 'Al Jazeera', '2024-06-19 14:20:00', 'Agreement reached to allow aid delivery to civilians in conflict-affected areas of Khartoum.'),
((SELECT id FROM conflicts WHERE slug = 'myanmar-internal-conflict'), 'Junta extends state of emergency', 'https://example.com/myanmar-emergency', 'Associated Press', '2024-06-19 09:45:00', 'Myanmar military government extends state of emergency for sixth consecutive time.'),
((SELECT id FROM conflicts WHERE slug = 'yemen-civil-war'), 'Coalition airstrikes target Houthi positions', 'https://example.com/yemen-airstrikes', 'Reuters', '2024-06-18 16:30:00', 'Saudi-led coalition conducts airstrikes against Houthi military installations in Yemen.');

-- Insert sample analysis links
INSERT INTO analysis_links (conflict_id, title, url, source, type) VALUES
((SELECT id FROM conflicts WHERE slug = 'ukraine-russia-conflict'), 'Institute for the Study of War: Russian Offensive Campaign Assessment', 'https://example.com/isw-report', 'Institute for the Study of War', 'think_tank'),
((SELECT id FROM conflicts WHERE slug = 'gaza-israel-conflict'), 'ICRC Report on Humanitarian Situation in Gaza', 'https://example.com/icrc-report', 'International Committee of the Red Cross', 'research'),
((SELECT id FROM conflicts WHERE slug = 'sudan-civil-war'), 'UN Security Council Resolution on Sudan', 'https://example.com/un-resolution', 'United Nations', 'think_tank'),
((SELECT id FROM conflicts WHERE slug = 'myanmar-internal-conflict'), 'Crisis Group: Myanmar Two Years After the Coup', 'https://example.com/crisis-group', 'International Crisis Group', 'think_tank'),
((SELECT id FROM conflicts WHERE slug = 'yemen-civil-war'), 'Backgrounder: The Yemen Conflict', 'https://example.com/backgrounder', 'Council on Foreign Relations', 'background');