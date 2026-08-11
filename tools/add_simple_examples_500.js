const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Dictionary of ultra-simple example sentences for TOEIC 500 words
const simpleExamples = {
    "surprised": { en: "I am very surprised.", vi: "Tôi rất ngạc nhiên." },
    "decide": { en: "We decide to go.", vi: "Chúng tôi quyết định đi." },
    "focus": { en: "Please focus on work.", vi: "Vui lòng tập trung vào công việc." },
    "business": { en: "He owns a big business.", vi: "Anh ấy sở hữu một doanh nghiệp lớn." },
    "breach": { en: "Do not breach the contract.", vi: "Đừng vi phạm hợp đồng." },
    "accept": { en: "I accept your plan.", vi: "Tôi chấp nhận kế hoạch của bạn." },
    "support": { en: "They support our team.", vi: "Họ hỗ trợ đội của chúng tôi." },
    "negotiate": { en: "We negotiate the price.", vi: "Chúng tôi thương lượng giá cả." },
    "obligate": { en: "You are not obligated.", vi: "Bạn không bị bắt buộc." },
    "deposit": { en: "Pay a small deposit.", vi: "Thanh toán một khoản tiền cọc nhỏ." },
    "affordable": { en: "The price is affordable.", vi: "Giá cả rất hợp lý." },
    "convince": { en: "She convinced me easily.", vi: "Cô ấy thuyết phục tôi một cách dễ dàng." },
    "party": { en: "Both parties agreed.", vi: "Cả hai bên đều đồng ý." },
    "compromise": { en: "They reached a compromise.", vi: "Họ đã đạt được sự thỏa hiệp." },
    "sign the contract": { en: "Please sign the contract.", vi: "Vui lòng ký hợp đồng." },
    "strategy": { en: "We need a new strategy.", vi: "Chúng ta cần một chiến lược mới." },
    "product": { en: "This product is good.", vi: "Sản phẩm này rất tốt." },
    "customer satisfaction": { en: "We care about customer satisfaction.", vi: "Chúng tôi quan tâm sự hài lòng của khách hàng." },
    "therefore": { en: "Therefore, we win.", vi: "Do đó, chúng ta thắng." },
    "lower price": { en: "We offer a lower price.", vi: "Chúng tôi đưa ra mức giá thấp hơn." },
    "quality": { en: "It has high quality.", vi: "Nó có chất lượng cao." },
    "customer": { en: "The customer is happy.", vi: "Khách hàng rất vui vẻ." },
    "grand opening": { en: "Welcome to our grand opening.", vi: "Chào mừng đến buổi lễ khai trương của chúng tôi." },
    "prepare": { en: "Prepare the main report.", vi: "Chuẩn bị báo cáo chính." },
    "brochure": { en: "Read our new brochure.", vi: "Đọc cuốn quảng cáo mới của chúng tôi." },
    "advertise": { en: "They advertise on TV.", vi: "Họ quảng cáo trên TV." },
    "attract": { en: "Low prices attract customers.", vi: "Giá thấp thu hút khách hàng." },
    "convenient location": { en: "Our shop has a convenient location.", vi: "Cửa hàng có vị trí thuận tiện." },
    "well-attended": { en: "The event was well-attended.", vi: "Sự kiện có rất nhiều người tham dự." },
    "special offer": { en: "Check our special offer.", vi: "Xem ưu đãi đặc biệt của chúng tôi." },
    "discount": { en: "Get a 10% discount.", vi: "Nhận giảm giá 10%." },
    "purchase": { en: "I want to purchase this.", vi: "Tôi muốn mua cái này." },
    "compare": { en: "Compare these two items.", vi: "So sánh hai mặt hàng này." },
    "various": { en: "We have various choices.", vi: "Chúng tôi có nhiều lựa chọn đa dạng." },
    "accommodate": { en: "The room accommodates 50 people.", vi: "Căn phòng đáp ứng sức chứa 50 người." },
    "those who": { en: "For those who need help.", vi: "Dành cho những ai cần giúp đỡ." },
    "free shipping": { en: "We offer free shipping.", vi: "Chúng tôi miễn phí giao hàng." },
    "announce": { en: "They will announce the winner.", vi: "Họ sẽ thông báo người chiến thắng." },
    "gather": { en: "We gather in the hall.", vi: "Chúng tôi tập hợp trong hội trường." },
    "address": { en: "The boss will address the team.", vi: "Sếp sẽ phát biểu trước toàn đội." },
    "demonstration": { en: "Watch a short demonstration.", vi: "Xem một bài thuyết minh ngắn." },
    "benefit": { en: "This plan brings great benefits.", vi: "Kế hoạch này mang lại nhiều lợi ích lớn." },
    "evaluate": { en: "We evaluate the results.", vi: "Chúng tôi đánh giá các kết quả." },
    "speech": { en: "His speech was great.", vi: "Bài phát biểu của anh ấy rất tuyệt." },
    "apply for": { en: "Apply for the new job.", vi: "Nộp đơn ứng tuyển công việc mới." },
    "membership": { en: "Renew your card membership.", vi: "Gia hạn thẻ thành viên của bạn." },
    "hold": { en: "They hold a meeting today.", vi: "Họ tổ chức một cuộc họp hôm nay." },
    "meeting": { en: "Join our weekly meeting.", vi: "Tham gia cuộc họp hàng tuần của chúng tôi." },
    "headquarters": { en: "Our headquarters is in Hanoi.", vi: "Trụ sở chính của chúng tôi ở Hà Nội." },
    "currently": { en: "She is currently busy.", vi: "Hiện tại cô ấy đang bận." },
    "accountant": { en: "He is a chief accountant.", vi: "Anh ấy là kế toán trưởng." },
    "technician": { en: "Call an IT technician.", vi: "Gọi một kỹ thuật viên IT." },
    "plan": { en: "I have a simple plan.", vi: "Tôi có một kế hoạch đơn giản." },
    "determine": { en: "Determine your goal now.", vi: "Xác định mục tiêu của bạn ngay." },
    "goal": { en: "Reach your main goal.", vi: "Đạt được mục tiêu chính của bạn." },
    "revenue": { en: "Revenue increased this month.", vi: "Doanh thu tháng này đã tăng." },
    "establish": { en: "They establish a new team.", vi: "Họ thành lập một đội mới." },
    "branch": { en: "Visit our local branch.", vi: "Ghé thăm chi nhánh địa phương của chúng tôi." },
    "designate": { en: "Designate a team leader.", vi: "Chỉ định một Trưởng nhóm." },
    "head of sales department": { en: "He is head of sales department.", vi: "Anh ấy là Trưởng phòng bán hàng." },
    "impressed": { en: "I am impressed by your work.", vi: "Tôi ấn tượng bởi công việc của bạn." },
    "experience": { en: "She has good experience.", vi: "Cô ấy có kinh nghiệm tốt." },
    "interview": { en: "I have a job interview.", vi: "Tôi có một buổi phỏng vấn xin việc." },
    "believe": { en: "I believe you can do it.", vi: "Tôi tin bạn có thể làm được." },
    "develop": { en: "Develop a new software.", vi: "Phát triển một phần mềm mới." },
    "contribute": { en: "Contribute to company growth.", vi: "Đóng góp vào sự phát triển công ty." },
    "increase sales": { en: "We need to increase sales.", vi: "Chúng ta cần tăng doanh số bán hàng." },
    "responsible for": { en: "She is responsible for marketing.", vi: "Cô ấy chịu trách nhiệm mảng marketing." },
    "supplier": { en: "Contact our key supplier.", vi: "Liên hệ nhà cung cấp chính của chúng tôi." },
    "budget": { en: "Keep within the budget.", vi: "Giữ trong tầm ngân sách." },
    "human resources department": { en: "Send CV to human resources department.", vi: "Gửi CV đến phòng nhân sự." },
    "salary": { en: "He gets a high salary.", vi: "Anh ấy nhận mức lương cao." },
    "opportunity": { en: "Grab this good opportunity.", vi: "Nắm bắt cơ hội tốt này." },
    "promote": { en: "Promote him to manager.", vi: "Thăng chức cho anh ấy lên quản lý." },
    "initiative": { en: "Take the initiative at work.", vi: "Chủ động đưa ra sáng kiến trong công việc." },
    "stay competitive": { en: "We must stay competitive.", vi: "Chúng ta phải duy trì tính cạnh tranh." },
    "colleague": { en: "Talk with your colleague.", vi: "Trò chuyện với đồng nghiệp của bạn." },
    "opinion": { en: "What is your opinion?", vi: "Ý kiến của bạn là gì?" },
    "risk": { en: "Avoid taking high risks.", vi: "Tránh chấp nhận rủi ro cao." },
    "change": { en: "Change your password regularly.", vi: "Thay đổi mật khẩu thường xuyên." },
    "continuously": { en: "Work continuously all day.", vi: "Làm việc liên tục cả ngày." },
    "defective": { en: "Return the defective item.", vi: "Trả lại mặt hàng bị lỗi." },
    "outdated": { en: "This system is outdated.", vi: "Hệ thống này đã lỗi thời." },
    "complain": { en: "Customers complain about delays.", vi: "Khách hàng phàn nàn về việc chậm trễ." },
    "return": { en: "Return the product in 7 days.", vi: "Trả lại sản phẩm trong 7 ngày." },
    "replace": { en: "Replace the old battery.", vi: "Thay thế viên pin cũ." },
    "refund": { en: "Ask for a full refund.", vi: "Yêu cầu hoàn tiền đầy đủ." },
    "invest": { en: "Invest in green energy.", vi: "Đầu tư vào năng lượng xanh." },
    "however": { en: "However, we tried our best.", vi: "Tuy nhiên, chúng tôi đã cố hết sức." },
    "price": { en: "The price is very fair.", vi: "Giá cả rất hợp lý." },
    "relatively": { en: "The task is relatively easy.", vi: "Nhiệm vụ này tương đối dễ." },
    "manufacturer": { en: "Contact the main manufacturer.", vi: "Liên hệ với nhà sản xuất chính." },
    "reasonable": { en: "Offer a reasonable price.", vi: "Đưa ra mức giá hợp lý." },
    "urgent": { en: "This is an urgent call.", vi: "Đây là một cuộc gọi khẩn cấp." },
    "within": { en: "Finish within 24 hours.", vi: "Hoàn thành trong vòng 24 giờ." },
    "solve": { en: "Solve the problem quickly.", vi: "Giải quyết vấn đề nhanh chóng." },
    "company": { en: "Our company grows fast.", vi: "Công ty chúng tôi phát triển nhanh." },
    "order": { en: "I place a new order.", vi: "Tôi đặt một đơn hàng mới." },
    "computer": { en: "Use your office computer.", vi: "Sử dụng máy tính văn phòng của bạn." },
    "guarantee": { en: "We guarantee 100% quality.", vi: "Chúng tôi đảm bảo 100% chất lượng." },
    "productivity": { en: "High productivity wins.", vi: "Năng suất cao sẽ chiến thắng." },
    "considerably": { en: "Sales grew considerably.", vi: "Doanh số đã tăng lên đáng kể." },
    "compatible": { en: "App is compatible with mobile.", vi: "Ứng dụng tương thích với điện thoại." },
    "printer": { en: "The office printer is ready.", vi: "Máy in văn phòng đã sẵn sàng." },
    "network": { en: "Check the local network.", vi: "Kiểm tra mạng nội bộ." },
    "software": { en: "Update your system software.", vi: "Cập nhật phần mềm hệ thống của bạn." },
    "make sure": { en: "Make sure to lock the door.", vi: "Hãy đảm bảo đã khóa cửa." },
    "document": { en: "Print out the document.", vi: "In tài liệu ra." },
    "confidential": { en: "Keep this file confidential.", vi: "Giữ tập tin này bí mật." },
    "copy": { en: "Make a copy of this page.", vi: "Tạo một bản sao của trang này." },
    "data": { en: "Save all user data.", vi: "Lưu tất cả dữ liệu người dùng." },
    "disk": { en: "Insert the disk now.", vi: "Chèn ổ đĩa vào ngay." },
    "access": { en: "Access your email account.", vi: "Truy cập tài khoản email của bạn." },
    "facilitate": { en: "Tools facilitate teamwork.", vi: "Công cụ giúp làm việc nhóm dễ dàng hơn." },
    "install": { en: "Install the latest update.", vi: "Cài đặt bản cập nhật mới nhất." },
    "training session": { en: "Join the training session.", vi: "Tham gia buổi huấn luyện." },
    "process": { en: "Trust the step process.", vi: "Tin tưởng quy trình từng bước." },
    "hesitate": { en: "Do not hesitate to ask.", vi: "Đừng ngần ngại đặt câu hỏi." },
    "contact": { en: "Contact customer support.", vi: "Liên hệ bộ phận hỗ trợ khách hàng." },
    "technical support": { en: "Call technical support.", vi: "Gọi cho bộ phận hỗ trợ kỹ thuật." },
    "detail": { en: "Explain in detail.", vi: "Giải thích chi tiết." },
    "reply to": { en: "Reply to my message.", vi: "Hồi đáp tin nhắn của tôi." },
    "announcement": { en: "Read the official announcement.", vi: "Đọc thông báo chính thức." },
    "lack of": { en: "A lack of time.", vi: "Sự thiếu hụt thời gian." },
    "expand": { en: "Expand our main business.", vi: "Mở rộng kinh doanh chính." },
    "recruit": { en: "Recruit 10 new workers.", vi: "Tuyển 10 công nhân mới." },
    "supervisor": { en: "Ask your supervisor.", vi: "Hỏi người giám sát của bạn." },
    "position": { en: "Apply for this position.", vi: "Nộp đơn cho vị trí này." },
    "candidate": { en: "Choose the best candidate.", vi: "Chọn ứng viên tốt nhất." },
    "application form": { en: "Fill out the application form.", vi: "Điền vào mẫu đơn đăng ký." },
    "enclose": { en: "Enclose your photo.", vi: "Đính kèm hình ảnh của bạn." },
    "applicant": { en: "Each applicant must test.", vi: "Mỗi ứng viên phải làm bài kiểm tra." },
    "submit": { en: "Submit the report today.", vi: "Nộp báo cáo hôm nay." },
    "hire": { en: "They hire a new manager.", vi: "Họ thuê một quản lý mới." },
    "requirement": { en: "Meet the basic requirement.", vi: "Đáp ứng yêu cầu cơ bản." },
    "choose": { en: "Choose the right option.", vi: "Chọn tùy chọn đúng." },
    "qualification": { en: "Show your qualification.", vi: "Hiển thị năng lực chuyên môn của bạn." },
    "at least": { en: "Wait at least 5 minutes.", vi: "Chờ ít nhất 5 phút." },
    "negotiable": { en: "The price is negotiable.", vi: "Giá cả có thể thương lượng." },
    "work overtime": { en: "He has to work overtime.", vi: "Anh ấy phải làm việc quá giờ." },
    "compensate": { en: "Compensate for your loss.", vi: "Đền bù cho rủi ro/mất mát của bạn." },
    "relocate": { en: "Relocate to a new city.", vi: "Di chuyển đến thành phố mới." },
    "go on business": { en: "I go on business trip.", vi: "Tôi đi công tác." },
    "consistently": { en: "Work consistently every day.", vi: "Làm việc liên tục mỗi ngày." },
    "eligible": { en: "You are eligible to join.", vi: "Bạn đủ điều kiện để tham gia." },
    "shortly thereafter": { en: "He left shortly thereafter.", vi: "Anh ấy rời đi ngay sau đó." },
    "take part in": { en: "Take part in the game.", vi: "Tham gia vào trò chơi." },
    "sign": { en: "Sign your name here.", vi: "Ký tên của bạn ở đây." },
    "assign": { en: "Assign task to him.", vi: "Phân công nhiệm vụ cho anh ấy." },
    "demonstrate": { en: "Demonstrate your skills.", vi: "Chứng minh kỹ năng của bạn." },
    "ability": { en: "Show your true ability.", vi: "Thể hiện năng lực thực sự của bạn." },
    "fire": { en: "Do not fire workers.", vi: "Đừng sa thải công nhân." },
    "permanent contract": { en: "Sign a permanent contract.", vi: "Ký hợp đồng dài hạn." },
    "medical coverage": { en: "Enjoy full medical coverage.", vi: "Hưởng đầy đủ bảo hiểm y tế." },
    "performance review": { en: "Pass the annual performance review.", vi: "Vượt qua kỳ đánh giá hiệu suất hàng năm." },
    "contribution": { en: "Thank you for your contribution.", vi: "Cảm ơn sự đóng góp của bạn." },
    "award": { en: "Win a top award.", vi: "Giành một giải thưởng lớn." },
    "campaign": { en: "Launch a marketing campaign.", vi: "Tung ra chiến dịch tiếp thị." },
    "reputation": { en: "Build a good reputation.", vi: "Xây dựng danh tiếng tốt." },
    "item": { en: "Buy a cheap item.", vi: "Mua một món hàng giá rẻ." },
    "convenient": { en: "Online pay is convenient.", vi: "Thanh toán online rất thuận tiện." },
    "merchandise": { en: "Check the new merchandise.", vi: "Kiểm tra lô hàng hóa mới." },
    "available": { en: "Rooms are available now.", vi: "Phòng hiện đang có sẵn." },
    "crucial": { en: "Speed is crucial here.", vi: "Tốc độ là yếu tố rất quan trọng ở đây." },
    "fulfill": { en: "Fulfill your order fast.", vi: "Hoàn thành đơn hàng nhanh chóng." },
    "catalog": { en: "See our product catalog.", vi: "Xem danh mục sản phẩm của chúng tôi." },
    "consult": { en: "Consult a doctor first.", vi: "Tư vấn bác sĩ trước." },
    "check": { en: "Check your email inbox.", vi: "Kiểm tra hộp thư email." },
    "warehouse": { en: "Store items in warehouse.", vi: "Lưu trữ hàng hóa trong nhà kho." },
    "remind": { en: "Remind me to call.", vi: "Nhắc tôi gọi điện." },
    "provide": { en: "Provide helpful tips.", vi: "Cung cấp các mẹo hữu ích." },
    "verify": { en: "Verify your phone number.", vi: "Xác nhận số điện thoại của bạn." },
    "invoice": { en: "Send the total invoice.", vi: "Gửi hóa đơn tổng." },
    "mistake": { en: "Fix your small mistake.", vi: "Sửa lỗi nhỏ của bạn." },
    "policy": { en: "Follow safety policy.", vi: "Tuân thủ chính sách an toàn." },
    "warranty": { en: "Includes 2-year warranty.", vi: "Bao gồm bảo hành 2 năm." },
    "buy in bulk": { en: "Buy in bulk for discounts.", vi: "Mua số lượng lớn để được giảm giá." },
    "no extra cost": { en: "Ship with no extra cost.", vi: "Giao hàng không tính thêm phí." },
    "delivery": { en: "Fast delivery service.", vi: "Dịch vụ giao hàng nhanh." },
    "charge": { en: "No extra service charge.", vi: "Không tính thêm phí dịch vụ." },
    "estimate": { en: "Estimate total cost.", vi: "Ước tính tổng chi phí." },
    "accurately": { en: "Calculate numbers accurately.", vi: "Tính toán các con số một cách chính xác." },
    "receive": { en: "Receive your prize today.", vi: "Nhận phần thưởng của bạn hôm nay." },
    "promptly": { en: "Reply to emails promptly.", vi: "Phản hồi email ngay lập tức." },
    "bank": { en: "Open a bank account.", vi: "Mở một tài khoản ngân hàng." },
    "activate": { en: "Activate card online.", vi: "Kích hoạt thẻ trực tuyến." },
    "account": { en: "Login to your account.", vi: "Đăng nhập vào tài khoản của bạn." },
    "transaction": { en: "Complete bank transaction.", vi: "Hoàn thành giao dịch ngân hàng." },
    "cashier": { en: "Pay money to cashier.", vi: "Trả tiền cho thu ngân." },
    "identification": { en: "Show ID identification card.", vi: "Trình thẻ chứng minh nhân dân." },
    "carefully": { en: "Drive carefully on road.", vi: "Lái xe cẩn thận trên đường." },
    "signature": { en: "Sign your signature here.", vi: "Ký chữ ký của bạn ở đây." },
    "outstanding bill": { en: "Pay outstanding bill now.", vi: "Thanh toán hóa đơn còn tồn đọng ngay." },
    "through": { en: "Go through the door.", vi: "Đi thông qua cánh cửa." },
    "forecast": { en: "Weather forecast is sunny.", vi: "Dự báo thời tiết là nắng." },
    "accounting": { en: "Study finance and accounting.", vi: "Học tài chính và kế toán." },
    "investor": { en: "Meet the key investor.", vi: "Gặp gỡ nhà đầu tư chính." },
    "long-term": { en: "A long-term investment.", vi: "Một khoản đầu tư dài hạn." },
    "real estate": { en: "Buy real estate house.", vi: "Mua bất động sản." },
    "intend to": { en: "I intend to travel.", vi: "Tôi dự định đi du lịch." },
    "apartment": { en: "Rent a small apartment.", vi: "Thuê một căn hộ nhỏ." },
    "public transportation": { en: "Use public transportation.", vi: "Sử dụng phương tiện công cộng." },
    "customize": { en: "Customize your profile.", vi: "Điều chỉnh trang cá nhân của bạn." },
    "competitor": { en: "Beat our competitor.", vi: "Đánh bại đối thủ của chúng ta." },
    "excellent service": { en: "They offer excellent service.", vi: "Họ cung cấp dịch vụ xuất sắc." },
    "reasonable price": { en: "Buy at a reasonable price.", vi: "Mua với giá cả hợp lý." },
    "magazine": { en: "Read business magazine.", vi: "Đọc tạp chí kinh doanh." },
    "famous": { en: "He is a famous actor.", vi: "Anh ấy là một diễn viên nổi tiếng." },
    "subscribe": { en: "Subscribe to our news.", vi: "Đăng ký nhận tin tức của chúng tôi." },
    "issue": { en: "Read the May issue.", vi: "Đọc ấn bản tháng Năm." },
    "publish": { en: "Publish a new book.", vi: "Xuất bản một cuốn sách mới." },
    "celebrate": { en: "Celebrate your success.", vi: "Kỷ niệm thành công của bạn." },
    "voucher": { en: "Use a $10 voucher.", vi: "Sử dụng phiếu giảm giá 10$." },
    "expire": { en: "Voucher expires today.", vi: "Phiếu giảm giá hết hạn hôm nay." },
    "renew": { en: "Renew your passport.", vi: "Gia hạn hộ chiếu của bạn." },
    "author": { en: "He is a famous author.", vi: "Anh ấy là một tác giả nổi tiếng." },
    "best seller": { en: "Book is a best seller.", vi: "Cuốn sách bán chạy nhất." },
    "athlete": { en: "She is a top athlete.", vi: "Cô ấy là một vận động viên hàng đầu." },
    "consecutive": { en: "Win 3 consecutive games.", vi: "Thắng 3 trận liên tiếp." },
    "unfortunately": { en: "Unfortunately, we lost.", vi: "Không may, chúng ta đã thua." },
    "discontinue": { en: "Discontinue old models.", vi: "Không tiếp tục sản xuất các mẫu cũ." },
    "career": { en: "Build a long career.", vi: "Xây dựng sự nghiệp lâu dài." },
    "achievement": { en: "A proud achievement.", vi: "Một thành tựu đáng tự hào." },
    "take place": { en: "Meeting takes place now.", vi: "Cuộc họp diễn ra bây giờ." },
    "audience": { en: "Clap for the audience.", vi: "Vỗ tay cùng khán giả." },
    "donate": { en: "Donate money to charity.", vi: "Tài trợ tiền cho từ thiện." },
    "charity fund": { en: "Give money to charity fund.", vi: "Quyên góp vào quỹ từ thiện." },
    "admission": { en: "Free admission for kids.", vi: "Miễn phí vé vào cửa cho trẻ em." },
    "capacity": { en: "Large room capacity.", vi: "Sức chứa phòng lớn." },
    "in advance": { en: "Book tickets in advance.", vi: "Đặt vé trước." }
};

// Generic generator for any unmapped words
function generateSimpleExample(en, vi, cat) {
    const word = en.toLowerCase().trim();
    const wordCap = en.charAt(0).toUpperCase() + en.slice(1);
    const mean = vi.toLowerCase().trim();

    if (cat && cat.includes('Động')) {
        return {
            en: `I want to ${word}.`,
            vi: `Tôi muốn ${mean}.`
        };
    }
    if (cat && cat.includes('Tính')) {
        return {
            en: `It is very ${word}.`,
            vi: `Nó rất ${mean}.`
        };
    }
    if (cat && cat.includes('Trạng')) {
        return {
            en: `Please do it ${word}.`,
            vi: `Vui lòng làm điều đó một cách ${mean}.`
        };
    }
    return {
        en: `This is a good ${word}.`,
        vi: `Đây là một ${mean} tốt.`
    };
}

(async () => {
    try {
        console.log('Adding simple 1-line example sentences to ALL 500-TOEIC words...');

        const jsonPath = path.join(__dirname, '..', '..', 'client', 'angel-english', 'src', 'data', 'data.json');
        let dataWords = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        let updatedCount = 0;

        dataWords = dataWords.map(w => {
            if (w.master_group === '500 Từ Vựng TOEIC Mất Gốc' || w.sub_group?.toLowerCase().includes('story')) {
                const cleanKey = w.en.toLowerCase().trim();
                const dictMatch = simpleExamples[cleanKey] || simpleExamples[w.en];

                let ex;
                if (dictMatch) {
                    ex = dictMatch;
                } else {
                    ex = generateSimpleExample(w.en, w.vi, w.category);
                }

                w.example_en = ex.en;
                w.example_vi = ex.vi;
                updatedCount++;
            }
            return w;
        });

        // Write back clean data.json
        fs.writeFileSync(jsonPath, JSON.stringify(dataWords, null, 2), 'utf8');
        console.log(`Updated ${updatedCount} words in data.json with super simple example sentences!`);

        // Update Database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '123456',
            database: process.env.DB_NAME || 'server_learning_english'
        });

        for (const w of dataWords) {
            if (w.master_group === '500 Từ Vựng TOEIC Mất Gốc') {
                await connection.query(
                    'UPDATE words SET example_en = ?, example_vi = ? WHERE id = ?',
                    [w.example_en, w.example_vi, w.id]
                );
            }
        }

        console.log('Successfully updated MySQL database with simple example sentences!');
        await connection.end();
    } catch (err) {
        console.error('Error adding simple examples:', err);
    }
})();
