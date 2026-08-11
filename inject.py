import json
import re

with open('examplesToTranslate.json', 'r', encoding='utf-8') as f:
    examples = json.load(f)

translations = [
    "Cuộc họp được lên lịch vào thứ Hai.",
    "Vui lòng nộp trước hạn chót.",
    "Cô ấy đã nộp báo cáo hàng tháng.",
    "Bạn làm việc ở phòng ban nào?",
    "Tất cả nhân viên phải tham gia buổi đào tạo.",
    "Người quản lý đã phê duyệt ngân sách.",
    "Hãy liên hệ với người giám sát của bạn để được phê duyệt.",
    "Các đồng nghiệp của tôi rất hỗ trợ.",
    "Trụ sở chính nằm ở New York.",
    "Chúng tôi có các chi nhánh ở 10 thành phố.",
    "Đơn hàng của bạn đã được xác nhận.",
    "Cô ấy đã mua 3 sản phẩm trực tuyến.",
    "Giữ lại biên lai của bạn để đổi trả.",
    "Hóa đơn đã được gửi qua email.",
    "Thành viên nhận được giảm giá 10%.",
    "Yêu cầu hoàn tiền trong vòng 30 ngày.",
    "Đổi hàng được phép trong vòng 14 ngày.",
    "Giao hàng miễn phí cho các đơn hàng trên $50.",
    "Lô hàng đã đến sáng nay.",
    "Mặt hàng này đã hết hàng.",
    "Chuyến bay khởi hành lúc 7 giờ sáng.",
    "Kiểm tra giờ khởi hành tại Cổng B3.",
    "Thời gian đến dự kiến là 3 giờ chiều.",
    "Quá trình lên máy bay bắt đầu trước 30 phút.",
    "Tôi muốn đặt chỗ trước.",
    "Chỗ ở đã được bao gồm trong gói.",
    "Lịch trình chuyến đi đã được xác nhận.",
    "Không có phí hành lý phụ thu.",
    "Khai báo hàng hóa tại hải quan.",
    "Yêu cầu có hộ chiếu hợp lệ.",
    "Ngân sách hàng năm đã được phê duyệt.",
    "Theo dõi tất cả các chi phí kinh doanh một cách cẩn thận.",
    "Doanh thu tăng trưởng 15% trong năm ngoái.",
    "Công ty đã tạo ra lợi nhuận đáng kể.",
    "Công ty đã báo cáo một khoản lỗ ròng.",
    "Đầu tư dài hạn mang lại lợi nhuận tốt hơn.",
    "Đăng ký khoản vay kinh doanh trực tuyến.",
    "Lãi suất là 5% mỗi năm.",
    "Nộp hồ sơ khai thuế của bạn trước ngày 15 tháng 4.",
    "Kiểm tra số dư tài khoản của bạn trực tuyến.",
    "Tôi có một cuộc hẹn với nha sĩ lúc 2 giờ chiều.",
    "Phòng khám mở cửa từ thứ Hai đến thứ Bảy.",
    "Dược sĩ đã kê đơn thuốc cho tôi.",
    "Đau đầu là một triệu chứng phổ biến của bệnh cúm.",
    "Bác sĩ đã đề xuất một phương pháp điều trị mới.",
    "Bác sĩ đang khám bệnh cho bệnh nhân.",
    "Bảo hiểm của bạn có chi trả cho ca phẫu thuật này không?",
    "Bác sĩ sẽ kiểm tra bạn ngay bây giờ.",
    "Anh ấy mất một tuần để phục hồi sau cơn cảm lạnh.",
    "Uống thuốc này sau bữa ăn.",
    "Vui lòng thông báo cho chúng tôi về bất kỳ thay đổi nào.",
    "Cuộc họp đã được hoãn lại đến thứ Năm.",
    "Sự kiện đã bị hủy do thời tiết xấu.",
    "Tuân thủ chính sách của công ty mọi lúc.",
    "Thủ tục đã được cập nhật.",
    "Chúng tôi đang tuyển dụng cho 5 vị trí.",
    "Nộp đơn ứng tuyển của bạn trước thứ Sáu.",
    "Gửi sơ yếu lý lịch của bạn cho phòng nhân sự.",
    "Cuộc phỏng vấn diễn ra vào thứ Tư.",
    "Chúng tôi đã thuê 10 nhân viên mới.",
    "Chúng tôi có một vị trí đang mở cho chức vụ này.",
    "Có một vị trí trống trong phòng kế toán.",
    "Yêu cầu trình độ chuyên môn cao.",
    "Đưa ra mức lương cạnh tranh.",
    "Các quyền lợi bao gồm bảo hiểm y tế.",
    "Áp dụng thời gian thử việc 3 tháng.",
    "Cô ấy sẽ nghỉ hưu vào cuối năm nay.",
    "Vui lòng cung cấp hai người giới thiệu.",
    "Quá trình giới thiệu nhân viên mới bắt đầu vào ngày đầu tiên của bạn.",
    "Chúng tôi đã thuê một không gian văn phòng nhỏ.",
    "Hợp đồng thuê hết hạn vào tháng tới.",
    "Bất động sản này nằm ở trung tâm thành phố.",
    "Chủ nhà đã đồng ý sửa mái nhà.",
    "Người thuê nhà phải trả tiền thuê vào ngày đầu tiên.",
    "Chúng tôi đang tìm kiếm một địa điểm thuận tiện.",
    "Họ đã cải tạo nhà bếp vào năm ngoái.",
    "Anh ấy đã cho thuê lại phòng của mình trong suốt mùa hè.",
    "Chúng tôi đã trả một khoản tiền đặt cọc bằng một tháng tiền thuê.",
    "Kiểm tra ngôi nhà trước khi mua.",
    "Nước và điện là các tiện ích.",
    "Căn hộ được trang bị đầy đủ nội thất.",
    "Đầu bếp đã chuẩn bị một món ăn đặc biệt.",
    "Tôi có thể xem thực đơn được không?",
    "Bia và nước có ga là các đồ uống phổ biến.",
    "Chúng tôi đã đặt chỗ cho bốn người.",
    "Thức ăn rất ngon nhưng phục vụ lại chậm.",
    "Hãy để lại tiền boa cho người phục vụ.",
    "Trộn tất cả các nguyên liệu vào một cái bát.",
    "Chiếc bánh sô cô la này rất ngon.",
    "Cô ấy điều hành một dịch vụ cung cấp đồ ăn uống.",
    "Hãy đọc các đánh giá nhà hàng trước khi đi.",
    "Chúng tôi đã gọi món khai vị trước.",
    "Cá là món ăn chính yêu thích của tôi.",
    "Làm theo công thức để nấu món này."
]

with open('J:/Leaning English Website/client/angel-english/src/data/toeic30DaysData.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, ex in enumerate(examples):
    idx = ex['index']
    vietnamese = translations[i]
    # Replace example: "..." with example: "...", exampleVi: "vietnamese"
    lines[idx] = re.sub(r'(example:\s*"[^"]+")', r'\g<1>, exampleVi: "' + vietnamese + '"', lines[idx])

with open('J:/Leaning English Website/client/angel-english/src/data/toeic30DaysData.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Injected successfully!")
