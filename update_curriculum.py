import re

file_path = 'J:/Leaning English Website/client/angel-english/src/data/toeic30DaysData.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

assignments = {
    6: { 'topic': 'H?p d?ng & Thu tín', 'groups': ['Contracts (H?p d?ng)', 'Correspondences (Thu tín)'] },
    7: { 'topic': 'K? ho?ch & Báo cáo', 'groups': ['Business planning (K? ho?ch kinh doanh)', 'Financial Statements (Báo cáo tài chính)'] },
    9: { 'topic': 'Ti?p th? & S? ki?n', 'groups': ['Marketing (Ti?p th?)', 'Events (S? ki?n)'] },
    11: { 'topic': 'S?n xu?t & Ch?t lu?ng', 'groups': ['Product Development (Phát tri?n s?n ph?m)', 'Quality Control (Qu?n tr? ch?t lu?ng)'] },
    13: { 'topic': 'V?n chuy?n & Hàng hóa', 'groups': ['Shipping (V?n chuy?n)', 'Inventory (Hàng hóa)'] },
    14: { 'topic': 'B?o hành & B?o hi?m', 'groups': ['Warranties (b?o hành)', 'Health Insurance (B?o hi?m s?c kh?e)'] },
    15: { 'topic': 'Công ngh? & Ði?n t?', 'groups': ['Computers (Máy tính)', 'Electronics (Ði?n t?)'] },
    16: { 'topic': 'Thang ti?n & Luong huu', 'groups': ['Promotions, Pensions and Awards (Thang ti?n, Luong huu và Gi?i thu?ng)', 'Accounting (K? toán)'] },
    17: { 'topic': 'D?ch v? & Khách s?n', 'groups': ['Car Rentals (Thuê ô tô)', 'Hotels (Khách s?n)'] },
    18: { 'topic': 'Gi?i trí & Truy?n thông', 'groups': ['Media (Truy?n thông)', 'Movies (Phim ?nh)'] },
    19: { 'topic': 'Ngh? thu?t & S? ki?n', 'groups': ['Theater (R?p phim)', 'Museums (B?o tàng)'] },
    20: { 'topic': 'Âm nh?c & Nha khoa', 'groups': ['Music (Âm nh?c)', 'Dentist’s Office (Phòng khám nha khoa)'] },
    21: { 'topic': 'H?i ngh?', 'groups': ['Conferences (H?i ngh?)'] }
}

def replacer(match):
    day_num = int(match.group(1))
    day_content = match.group(0)
    
    if day_num in assignments:
        topic = assignments[day_num]['topic']
        groups_str = ', '.join([f'"{g}"' for g in assignments[day_num]['groups']])
        
        # Replace or add vocabTopic
        if 'vocabTopic:' in day_content:
            day_content = re.sub(r'vocabTopic:\s*".*?"', f'vocabTopic: "{topic}"', day_content)
        else:
            day_content = re.sub(r'(practiceType:.*?,\n)', rf'\1    vocabTopic: "{topic}",\n', day_content)
            
        # Replace or add vocabSubGroups
        if 'vocabSubGroups:' in day_content:
            day_content = re.sub(r'vocabSubGroups:\s*\[.*?\]', f'vocabSubGroups: [{groups_str}]', day_content)
        else:
            day_content = re.sub(r'(vocabTopic:.*?,\n)', rf'\1    vocabSubGroups: [{groups_str}],\n', day_content)
            
    return day_content

new_content = re.sub(r'{\s*day:\s*(\d+),[\s\S]*?(?=theory:)', replacer, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated successfully!")
