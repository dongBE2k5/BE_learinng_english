# -*- coding: utf-8 -*-
import re

file_path = 'J:/Leaning English Website/client/angel-english/src/data/toeic30DaysData.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

assignments = {
    6: { 'topic': 'Hợp đồng & Thư tín', 'groups': ['Contracts (Hợp đồng)', 'Correspondences (Thư tín)'] },
    7: { 'topic': 'Kế hoạch & Báo cáo', 'groups': ['Business planning (Kế hoạch kinh doanh)', 'Financial Statements (Báo cáo tài chính)'] },
    9: { 'topic': 'Tiếp thị & Sự kiện', 'groups': ['Marketing (Tiếp thị)', 'Events (Sự kiện)'] },
    11: { 'topic': 'Sản xuất & Chất lượng', 'groups': ['Product Development (Phát triển sản phẩm)', 'Quality Control (Quản trị chất lượng)'] },
    13: { 'topic': 'Vận chuyển & Hàng hóa', 'groups': ['Shipping (Vận chuyển)', 'Inventory (Hàng hóa)'] },
    14: { 'topic': 'Bảo hành & Bảo hiểm', 'groups': ['Warranties (bảo hành)', 'Health Insurance (Bảo hiểm sức khỏe)'] },
    15: { 'topic': 'Công nghệ & Điện tử', 'groups': ['Computers (Máy tính)', 'Electronics (Điện tử)'] },
    16: { 'topic': 'Thăng tiến & Lương hưu', 'groups': ['Promotions, Pensions and Awards (Thăng tiến, Lương hưu và Giải thưởng)', 'Accounting (Kế toán)'] },
    17: { 'topic': 'Dịch vụ & Khách sạn', 'groups': ['Car Rentals (Thuê ô tô)', 'Hotels (Khách sạn)'] },
    18: { 'topic': 'Giải trí & Truyền thông', 'groups': ['Media (Truyền thông)', 'Movies (Phim ảnh)'] },
    19: { 'topic': 'Nghệ thuật & Sự kiện', 'groups': ['Theater (Rạp phim)', 'Museums (Bảo tàng)'] },
    20: { 'topic': 'Âm nhạc & Nha khoa', 'groups': ['Music (Âm nhạc)', 'Dentist’s Office (Phòng khám nha khoa)'] },
    21: { 'topic': 'Hội nghị', 'groups': ['Conferences (Hội nghị)'] }
}

def replacer(match):
    day_num = int(match.group(1))
    day_content = match.group(0)
    
    if day_num in assignments:
        topic = assignments[day_num]['topic']
        groups_str = ', '.join([f'"{g}"' for g in assignments[day_num]['groups']])
        
        if 'vocabTopic:' in day_content:
            day_content = re.sub(r'vocabTopic:\s*".*?"', f'vocabTopic: "{topic}"', day_content)
        else:
            day_content = re.sub(r'(practiceType:.*?,\n)', rf'\1    vocabTopic: "{topic}",\n', day_content)
            
        if 'vocabSubGroups:' in day_content:
            day_content = re.sub(r'vocabSubGroups:\s*\[.*?\]', f'vocabSubGroups: [{groups_str}]', day_content)
        else:
            day_content = re.sub(r'(vocabTopic:.*?,\n)', rf'\1    vocabSubGroups: [{groups_str}],\n', day_content)
            
    return day_content

new_content = re.sub(r'\{\s*day:\s*(\d+),[\s\S]*?(?=theory:)', replacer, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated successfully!")
