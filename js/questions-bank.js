/* Ngân hàng câu hỏi MẪU (133 câu, lấy từ bản "Tạ Quang Bửu: Mùa Ôn Thi").
   Chỉ dùng cho chế độ ngoại tuyến và để nạp vào Supabase lần đầu (supabase/seed_questions.sql).
   Khi có kho thật: nhập qua trang Quản trị → Câu hỏi → Nhập JSON. */
window.QUESTION_BANK = [
{
"id": "GT1-001",
"mon": "GT1",
"chuong": "GT1.1",
"doKho": 1,
"kieu": "mc",
"de": "Giới hạn $\\lim\\limits_{x\\to 0}\\dfrac{\\sin x}{x}$ bằng",
"lua": [
"$1$",
"$0$",
"$+\\infty$",
"Không tồn tại"
],
"dap": 0,
"giai": "Giới hạn cơ bản: khi $x\\to0$ thì $\\sin x\\sim x$, nên $\\dfrac{\\sin x}{x}\\to 1$.",
"dungChoCauChung": true
},
{
"id": "GT1-002",
"mon": "GT1",
"chuong": "GT1.1",
"doKho": 1,
"kieu": "mc",
"de": "$\\lim\\limits_{n\\to\\infty}\\left(1+\\dfrac{1}{n}\\right)^{n}$ bằng",
"lua": [
"$1$",
"$e$",
"$+\\infty$",
"$0$"
],
"dap": 1,
"giai": "Đây là định nghĩa số $e$. Dạng vô định $1^\\infty$ không có nghĩa là kết quả bằng $1$.",
"dungChoCauChung": true
},
{
"id": "GT1-003",
"mon": "GT1",
"chuong": "GT1.1",
"doKho": 1,
"kieu": "mc",
"de": "Dãy $u_n=\\dfrac{(-1)^n}{n}$",
"lua": [
"phân kỳ vì dấu đổi liên tục",
"hội tụ về $1$",
"hội tụ về $0$",
"hội tụ về $-1$"
],
"dap": 2,
"giai": "$|u_n|=\\dfrac1n\\to0$ nên $u_n\\to0$. Dấu đổi liên tục không cản trở hội tụ.",
"dungChoCauChung": true
},
{
"id": "GT1-004",
"mon": "GT1",
"chuong": "GT1.1",
"doKho": 1,
"kieu": "mc",
"de": "$\\lim\\limits_{x\\to 0}\\dfrac{e^{x}-1}{x}$ bằng",
"lua": [
"$0$",
"$e$",
"$1$",
"$+\\infty$"
],
"dap": 2,
"giai": "VCB tương đương: $e^x-1\\sim x$ khi $x\\to0$, nên giới hạn bằng $1$.",
"dungChoCauChung": true
},
{
"id": "GT1-005",
"mon": "GT1",
"chuong": "GT1.1",
"doKho": 2,
"kieu": "mc",
"de": "Cho $f(x)=\\dfrac{\\sin x}{x}$ khi $x\\ne0$ và $f(0)=a$. Hàm liên tục tại $0$ khi",
"lua": [
"$a=1$",
"$a=0$",
"$a=-1$",
"không có $a$ nào"
],
"dap": 0,
"giai": "Liên tục tại $0$ khi $f(0)=\\lim\\limits_{x\\to0}f(x)=1$.",
"dungChoCauChung": true
},
{
"id": "GT1-006",
"mon": "GT1",
"chuong": "GT1.1",
"doKho": 2,
"kieu": "mc",
"de": "$\\lim\\limits_{x\\to 0^+} x\\ln x$ bằng",
"lua": [
"$-\\infty$",
"$0$",
"$1$",
"$-1$"
],
"dap": 1,
"giai": "Viết $x\\ln x=\\dfrac{\\ln x}{1/x}$, dạng $\\dfrac{\\infty}{\\infty}$. L'Hôpital: $\\dfrac{1/x}{-1/x^2}=-x\\to0$.",
"dungChoCauChung": true
},
{
"id": "GT1-007",
"mon": "GT1",
"chuong": "GT1.1",
"doKho": 1,
"kieu": "tf",
"de": "Mọi dãy số bị chặn đều hội tụ.",
"lua": [
"Đúng",
"Sai"
],
"dap": 1,
"giai": "Phản ví dụ: $u_n=(-1)^n$ bị chặn nhưng phân kỳ. Bolzano–Weierstrass chỉ đảm bảo có một dãy con hội tụ.",
"dungChoCauChung": true
},
{
"id": "GT1-008",
"mon": "GT1",
"chuong": "GT1.1",
"doKho": 1,
"kieu": "tf",
"de": "Nếu $f$ liên tục trên $[a;b]$ và $f(a)f(b)<0$ thì phương trình $f(x)=0$ có nghiệm trong $(a;b)$.",
"lua": [
"Đúng",
"Sai"
],
"dap": 0,
"giai": "Định lý giá trị trung gian (Bolzano–Cauchy).",
"dungChoCauChung": true
},
{
"id": "GT1-009",
"mon": "GT1",
"chuong": "GT1.1",
"doKho": 2,
"kieu": "mc",
"de": "Với $f(x)=\\dfrac{|x|}{x}$, điểm $x=0$ là",
"lua": [
"điểm gián đoạn loại 1 (bước nhảy)",
"điểm gián đoạn khử được",
"điểm gián đoạn loại 2",
"điểm liên tục"
],
"dap": 0,
"giai": "$f(0^+)=1$, $f(0^-)=-1$: hai giới hạn một phía hữu hạn nhưng khác nhau, nên là gián đoạn loại 1.",
"dungChoCauChung": true
},
{
"id": "GT1-010",
"mon": "GT1",
"chuong": "GT1.1",
"doKho": 2,
"kieu": "mc",
"de": "Khi $x\\to0$, vô cùng bé nào tương đương với $x^2$?",
"lua": [
"$1-\\cos x$",
"$\\sin x$",
"$1-\\cos(\\sqrt2\\,x)$",
"$\\tan(x^3)$"
],
"dap": 2,
"giai": "$1-\\cos u\\sim\\dfrac{u^2}{2}$, với $u=\\sqrt2x$ được $\\dfrac{2x^2}{2}=x^2$.",
"dungChoCauChung": true
},
{
"id": "GT1-011",
"mon": "GT1",
"chuong": "GT1.2",
"doKho": 1,
"kieu": "mc",
"de": "$(\\ln x)'$ bằng",
"lua": [
"$\\dfrac{1}{x}$",
"$\\ln x$",
"$\\dfrac{1}{x\\ln 10}$",
"$x\\ln x-x$"
],
"dap": 0,
"giai": "Công thức cơ bản: $(\\ln x)'=\\dfrac1x$. Còn $\\dfrac{1}{x\\ln10}$ là đạo hàm của $\\log_{10}x$.",
"dungChoCauChung": true
},
{
"id": "GT1-012",
"mon": "GT1",
"chuong": "GT1.2",
"doKho": 1,
"kieu": "mc",
"de": "$(\\arctan x)'$ bằng",
"lua": [
"$\\dfrac{1}{\\sqrt{1-x^2}}$",
"$\\dfrac{1}{1+x^2}$",
"$-\\dfrac{1}{1+x^2}$",
"$\\dfrac{1}{1-x^2}$"
],
"dap": 1,
"giai": "Bảng đạo hàm: $(\\arctan x)'=\\dfrac{1}{1+x^2}$. $\\dfrac{1}{\\sqrt{1-x^2}}$ là của $\\arcsin x$.",
"dungChoCauChung": true
},
{
"id": "GT1-013",
"mon": "GT1",
"chuong": "GT1.2",
"doKho": 2,
"kieu": "mc",
"de": "Với $x>0$, $(x^x)'$ bằng",
"lua": [
"$x\\cdot x^{x-1}$",
"$x^x\\ln x$",
"$x^x(\\ln x+1)$",
"$x^x$"
],
"dap": 2,
"giai": "$x^x=e^{x\\ln x}$ nên $(x^x)'=e^{x\\ln x}(\\ln x+1)=x^x(\\ln x+1)$.",
"dungChoCauChung": true
},
{
"id": "GT1-014",
"mon": "GT1",
"chuong": "GT1.2",
"doKho": 1,
"kieu": "mc",
"de": "Vi phân $d(\\sin^2 x)$ bằng",
"lua": [
"$\\sin 2x\\,dx$",
"$2\\sin x\\,dx$",
"$\\cos^2x\\,dx$",
"$2\\cos x\\,dx$"
],
"dap": 0,
"giai": "$d(\\sin^2x)=2\\sin x\\cos x\\,dx=\\sin2x\\,dx$.",
"dungChoCauChung": true
},
{
"id": "GT1-015",
"mon": "GT1",
"chuong": "GT1.2",
"doKho": 1,
"kieu": "tf",
"de": "Hàm khả vi tại $x_0$ thì liên tục tại $x_0$.",
"lua": [
"Đúng",
"Sai"
],
"dap": 0,
"giai": "Khả vi kéo theo liên tục. Chiều ngược lại sai, ví dụ $|x|$ tại $0$.",
"dungChoCauChung": true
},
{
"id": "GT1-016",
"mon": "GT1",
"chuong": "GT1.2",
"doKho": 1,
"kieu": "tf",
"de": "Hàm $f(x)=|x|$ có đạo hàm tại $x=0$.",
"lua": [
"Đúng",
"Sai"
],
"dap": 1,
"giai": "$f'_+(0)=1$, $f'_-(0)=-1$ khác nhau, nên không có đạo hàm tại $0$.",
"dungChoCauChung": true
},
{
"id": "GT1-017",
"mon": "GT1",
"chuong": "GT1.2",
"doKho": 1,
"kieu": "mc",
"de": "Đạo hàm cấp $n$ của $e^{2x}$ là",
"lua": [
"$e^{2x}$",
"$2n\\,e^{2x}$",
"$2^n e^{2x}$",
"$n!\\,e^{2x}$"
],
"dap": 2,
"giai": "Mỗi lần đạo hàm nhân thêm $2$, sau $n$ lần được $2^ne^{2x}$.",
"dungChoCauChung": true
},
{
"id": "GT1-018",
"mon": "GT1",
"chuong": "GT1.2",
"doKho": 2,
"kieu": "mc",
"de": "Cho $x=t^2$, $y=t^3$ ($t\\ne0$). Đạo hàm $y'_x$ bằng",
"lua": [
"$\\dfrac{3t}{2}$",
"$\\dfrac{2}{3t}$",
"$\\dfrac{3t^2}{2}$",
"$6t^3$"
],
"dap": 0,
"giai": "$y'_x=\\dfrac{y'_t}{x'_t}=\\dfrac{3t^2}{2t}=\\dfrac{3t}{2}$.",
"dungChoCauChung": true
},
{
"id": "GT1-019",
"mon": "GT1",
"chuong": "GT1.2",
"doKho": 1,
"kieu": "mc",
"de": "Với $f(x)=\\sqrt x$, $f'(4)$ bằng",
"lua": [
"$\\dfrac12$",
"$\\dfrac14$",
"$2$",
"$\\dfrac18$"
],
"dap": 1,
"giai": "$f'(x)=\\dfrac{1}{2\\sqrt x}$ nên $f'(4)=\\dfrac{1}{2\\cdot2}=\\dfrac14$.",
"dungChoCauChung": true
},
{
"id": "GT1-020",
"mon": "GT1",
"chuong": "GT1.3",
"doKho": 1,
"kieu": "mc",
"de": "Khai triển Maclaurin của $\\cos x$ đến $x^4$ là",
"lua": [
"$1-\\dfrac{x^2}{2}+\\dfrac{x^4}{24}$",
"$1+\\dfrac{x^2}{2}+\\dfrac{x^4}{24}$",
"$1-\\dfrac{x^2}{2}+\\dfrac{x^4}{4}$",
"$x-\\dfrac{x^3}{6}$"
],
"dap": 0,
"giai": "$\\cos x=\\sum (-1)^k\\dfrac{x^{2k}}{(2k)!}$: $1-\\dfrac{x^2}{2!}+\\dfrac{x^4}{4!}+o(x^4)$.",
"dungChoCauChung": true
},
{
"id": "GT1-021",
"mon": "GT1",
"chuong": "GT1.3",
"doKho": 2,
"kieu": "mc",
"de": "$\\lim\\limits_{x\\to0}\\dfrac{x-\\sin x}{x^3}$ bằng",
"lua": [
"$0$",
"$\\dfrac16$",
"$\\dfrac13$",
"$-\\dfrac16$"
],
"dap": 1,
"giai": "$\\sin x=x-\\dfrac{x^3}{6}+o(x^3)$ nên $x-\\sin x\\sim\\dfrac{x^3}{6}$.",
"dungChoCauChung": true
},
{
"id": "GT1-022",
"mon": "GT1",
"chuong": "GT1.3",
"doKho": 1,
"kieu": "mc",
"de": "$\\lim\\limits_{x\\to+\\infty}\\dfrac{\\ln x}{x}$ bằng",
"lua": [
"$0$",
"$1$",
"$+\\infty$",
"Không tồn tại"
],
"dap": 0,
"giai": "L'Hôpital: $\\dfrac{1/x}{1}\\to0$. Hàm $\\ln$ tăng chậm hơn mọi lũy thừa dương.",
"dungChoCauChung": true
},
{
"id": "GT1-023",
"mon": "GT1",
"chuong": "GT1.3",
"doKho": 2,
"kieu": "mc",
"de": "$\\lim\\limits_{x\\to0}\\dfrac{\\tan x-x}{x^3}$ bằng",
"lua": [
"$\\dfrac16$",
"$0$",
"$\\dfrac13$",
"$1$"
],
"dap": 2,
"giai": "$\\tan x=x+\\dfrac{x^3}{3}+o(x^3)$ nên giới hạn bằng $\\dfrac13$.",
"dungChoCauChung": true
},
{
"id": "GT1-024",
"mon": "GT1",
"chuong": "GT1.3",
"doKho": 1,
"kieu": "tf",
"de": "Nếu $f'(x_0)=0$ thì $x_0$ là điểm cực trị của $f$.",
"lua": [
"Đúng",
"Sai"
],
"dap": 1,
"giai": "Phản ví dụ: $f(x)=x^3$ có $f'(0)=0$ nhưng $0$ không là cực trị. $f'(x_0)=0$ chỉ là điều kiện cần.",
"dungChoCauChung": true
},
{
"id": "GT1-025",
"mon": "GT1",
"chuong": "GT1.3",
"doKho": 1,
"kieu": "mc",
"de": "Hàm $y=x^3-3x$ đạt cực đại tại",
"lua": [
"$x=-1$",
"$x=1$",
"$x=0$",
"$x=\\sqrt3$"
],
"dap": 0,
"giai": "$y'=3x^2-3=0\\Leftrightarrow x=\\pm1$; $y''=6x$, $y''(-1)=-6<0$ nên cực đại tại $x=-1$.",
"dungChoCauChung": true
},
{
"id": "GT1-026",
"mon": "GT1",
"chuong": "GT1.3",
"doKho": 2,
"kieu": "mc",
"de": "Điểm uốn của đồ thị $y=x^3-3x^2+2$ là",
"lua": [
"$(0;2)$",
"$(1;0)$",
"$(2;-2)$",
"$(1;2)$"
],
"dap": 1,
"giai": "$y''=6x-6$ đổi dấu tại $x=1$, $y(1)=0$. Điểm $(2;-2)$ là điểm cực tiểu.",
"dungChoCauChung": true
},
{
"id": "GT1-027",
"mon": "GT1",
"chuong": "GT1.3",
"doKho": 1,
"kieu": "mc",
"de": "Tiệm cận ngang của đồ thị $y=\\dfrac{2x+1}{x-3}$ là",
"lua": [
"$x=3$",
"$y=-\\dfrac13$",
"$y=2$",
"$y=\\dfrac12$"
],
"dap": 2,
"giai": "$\\lim\\limits_{x\\to\\pm\\infty}y=2$. Còn $x=3$ là tiệm cận đứng.",
"dungChoCauChung": true
},
{
"id": "GT1-028",
"mon": "GT1",
"chuong": "GT1.4",
"doKho": 1,
"kieu": "mc",
"de": "$\\displaystyle\\int\\frac{dx}{x}$ bằng",
"lua": [
"$\\ln|x|+C$",
"$-\\dfrac{1}{x^2}+C$",
"$\\dfrac1x+C$",
"$x\\ln x+C$"
],
"dap": 0,
"giai": "$(\\ln|x|)'=\\dfrac1x$ với mọi $x\\ne0$.",
"dungChoCauChung": true
},
{
"id": "GT1-029",
"mon": "GT1",
"chuong": "GT1.4",
"doKho": 2,
"kieu": "mc",
"de": "$\\displaystyle\\int xe^x\\,dx$ bằng",
"lua": [
"$xe^x+C$",
"$(x-1)e^x+C$",
"$(x+1)e^x+C$",
"$\\dfrac{x^2}{2}e^x+C$"
],
"dap": 1,
"giai": "Từng phần: $u=x$, $dv=e^xdx$: $xe^x-\\int e^xdx=(x-1)e^x+C$.",
"dungChoCauChung": true
},
{
"id": "GT1-030",
"mon": "GT1",
"chuong": "GT1.4",
"doKho": 1,
"kieu": "mc",
"de": "$\\displaystyle\\int\\frac{dx}{1+x^2}$ bằng",
"lua": [
"$\\ln(1+x^2)+C$",
"$\\arcsin x+C$",
"$\\arctan x+C$",
"$\\dfrac{1}{2x}\\ln(1+x^2)+C$"
],
"dap": 2,
"giai": "Bảng nguyên hàm cơ bản.",
"dungChoCauChung": true
},
{
"id": "GT1-031",
"mon": "GT1",
"chuong": "GT1.4",
"doKho": 2,
"kieu": "mc",
"de": "$\\displaystyle\\int\\sin^2x\\,dx$ bằng",
"lua": [
"$\\dfrac x2-\\dfrac{\\sin2x}{4}+C$",
"$\\dfrac{\\sin^3x}{3}+C$",
"$\\dfrac x2+\\dfrac{\\sin2x}{4}+C$",
"$-\\cos^2x+C$"
],
"dap": 0,
"giai": "Hạ bậc: $\\sin^2x=\\dfrac{1-\\cos2x}{2}$, nguyên hàm $\\dfrac x2-\\dfrac{\\sin2x}{4}+C$.",
"dungChoCauChung": true
},
{
"id": "GT1-032",
"mon": "GT1",
"chuong": "GT1.4",
"doKho": 2,
"kieu": "mc",
"de": "$\\displaystyle\\int\\frac{dx}{x^2-1}$ bằng",
"lua": [
"$\\dfrac12\\ln\\left|\\dfrac{x+1}{x-1}\\right|+C$",
"$\\dfrac12\\ln\\left|\\dfrac{x-1}{x+1}\\right|+C$",
"$\\ln|x^2-1|+C$",
"$\\arctan x+C$"
],
"dap": 1,
"giai": "$\\dfrac{1}{x^2-1}=\\dfrac12\\left(\\dfrac{1}{x-1}-\\dfrac{1}{x+1}\\right)$ nên nguyên hàm là $\\dfrac12\\ln\\left|\\dfrac{x-1}{x+1}\\right|+C$.",
"dungChoCauChung": false
},
{
"id": "GT1-033",
"mon": "GT1",
"chuong": "GT1.4",
"doKho": 1,
"kieu": "tf",
"de": "Mọi hàm liên tục trên một khoảng đều có nguyên hàm trên khoảng đó.",
"lua": [
"Đúng",
"Sai"
],
"dap": 0,
"giai": "Có thể lấy $F(x)=\\int_{a}^{x}f(t)\\,dt$ (định lý cơ bản của giải tích).",
"dungChoCauChung": true
},
{
"id": "GT1-034",
"mon": "GT1",
"chuong": "GT1.4",
"doKho": 1,
"kieu": "mc",
"de": "$\\displaystyle\\int\\frac{\\ln x}{x}\\,dx$ bằng",
"lua": [
"$\\dfrac{\\ln^2x}{2}+C$",
"$\\ln^2x+C$",
"$\\ln(\\ln x)+C$",
"$\\dfrac{x\\ln x}{2}+C$"
],
"dap": 0,
"giai": "Đặt $t=\\ln x$, $dt=\\dfrac{dx}{x}$: $\\int t\\,dt=\\dfrac{t^2}{2}+C$.",
"dungChoCauChung": true
},
{
"id": "GT1-035",
"mon": "GT1",
"chuong": "GT1.5",
"doKho": 1,
"kieu": "mc",
"de": "$\\displaystyle\\int_0^1x^2\\,dx$ bằng",
"lua": [
"$\\dfrac12$",
"$\\dfrac13$",
"$1$",
"$\\dfrac23$"
],
"dap": 1,
"giai": "$\\left.\\dfrac{x^3}{3}\\right|_0^1=\\dfrac13$.",
"dungChoCauChung": true
},
{
"id": "GT1-036",
"mon": "GT1",
"chuong": "GT1.5",
"doKho": 1,
"kieu": "mc",
"de": "$\\displaystyle\\int_0^{\\pi}\\sin x\\,dx$ bằng",
"lua": [
"$0$",
"$-2$",
"$2$",
"$1$"
],
"dap": 2,
"giai": "$\\left.-\\cos x\\right|_0^{\\pi}=-(-1)+1=2$.",
"dungChoCauChung": true
},
{
"id": "GT1-037",
"mon": "GT1",
"chuong": "GT1.5",
"doKho": 1,
"kieu": "mc",
"de": "$\\displaystyle\\int_{-1}^{1}x^3\\cos x\\,dx$ bằng",
"lua": [
"$0$",
"$2\\cos1$",
"$1$",
"$-1$"
],
"dap": 0,
"giai": "$x^3\\cos x$ là hàm lẻ, cận đối xứng nên tích phân bằng $0$.",
"dungChoCauChung": true
},
{
"id": "GT1-038",
"mon": "GT1",
"chuong": "GT1.5",
"doKho": 2,
"kieu": "mc",
"de": "$\\dfrac{d}{dx}\\displaystyle\\int_0^{x^2}e^{t^2}\\,dt$ bằng",
"lua": [
"$e^{x^4}$",
"$e^{x^2}$",
"$2x\\,e^{x^4}$",
"$2x\\,e^{x^2}$"
],
"dap": 2,
"giai": "$\\left(\\int_0^{u(x)}f\\right)'=f(u(x))\\,u'(x)=e^{x^4}\\cdot2x$.",
"dungChoCauChung": true
},
{
"id": "GT1-039",
"mon": "GT1",
"chuong": "GT1.5",
"doKho": 1,
"kieu": "mc",
"de": "$\\displaystyle\\int_1^{+\\infty}\\frac{dx}{x^2}$",
"lua": [
"hội tụ, bằng $1$",
"hội tụ, bằng $\\dfrac12$",
"phân kỳ",
"hội tụ, bằng $2$"
],
"dap": 0,
"giai": "$\\left.-\\dfrac1x\\right|_1^{+\\infty}=0-(-1)=1$.",
"dungChoCauChung": true
},
{
"id": "GT1-040",
"mon": "GT1",
"chuong": "GT1.5",
"doKho": 2,
"kieu": "mc",
"de": "$\\displaystyle\\int_0^1\\frac{dx}{\\sqrt x}$",
"lua": [
"phân kỳ vì hàm không bị chặn",
"hội tụ, bằng $2$",
"hội tụ, bằng $\\dfrac12$",
"hội tụ, bằng $1$"
],
"dap": 1,
"giai": "Tích phân suy rộng loại 2 với $p=\\tfrac12<1$ hội tụ: $\\left.2\\sqrt x\\right|_0^1=2$.",
"dungChoCauChung": true
},
{
"id": "GT1-041",
"mon": "GT1",
"chuong": "GT1.5",
"doKho": 1,
"kieu": "mc",
"de": "Diện tích hình phẳng giới hạn bởi $y=x^2$ và $y=x$ bằng",
"lua": [
"$\\dfrac16$",
"$\\dfrac13$",
"$\\dfrac12$",
"$\\dfrac56$"
],
"dap": 0,
"giai": "Giao tại $x=0$, $x=1$: $S=\\int_0^1(x-x^2)dx=\\dfrac12-\\dfrac13=\\dfrac16$.",
"dungChoCauChung": true
},
{
"id": "GT1-042",
"mon": "GT1",
"chuong": "GT1.5",
"doKho": 2,
"kieu": "tf",
"de": "Tích phân $\\displaystyle\\int_1^{+\\infty}\\frac{\\sin^2x}{x^2}\\,dx$ hội tụ.",
"lua": [
"Đúng",
"Sai"
],
"dap": 0,
"giai": "$0\\le\\dfrac{\\sin^2x}{x^2}\\le\\dfrac1{x^2}$ và $\\int_1^{+\\infty}\\dfrac{dx}{x^2}$ hội tụ, nên hội tụ theo tiêu chuẩn so sánh.",
"dungChoCauChung": true
},
{
"id": "GT1-043",
"mon": "GT1",
"chuong": "GT1.5",
"doKho": 2,
"kieu": "mc",
"de": "Quay miền $0\\le y\\le\\sqrt x$, $0\\le x\\le1$ quanh trục $Ox$. Thể tích bằng",
"lua": [
"$\\dfrac{\\pi}{3}$",
"$\\dfrac{\\pi}{2}$",
"$\\pi$",
"$\\dfrac{2\\pi}{3}$"
],
"dap": 1,
"giai": "$V=\\pi\\int_0^1(\\sqrt x)^2dx=\\pi\\int_0^1x\\,dx=\\dfrac{\\pi}{2}$.",
"dungChoCauChung": true
},
{
"id": "GT1-044",
"mon": "GT1",
"chuong": "GT1.5",
"doKho": 1,
"kieu": "mc",
"de": "$\\displaystyle\\int_0^{2}|x-1|\\,dx$ bằng",
"lua": [
"$0$",
"$1$",
"$2$",
"$\\dfrac12$"
],
"dap": 1,
"giai": "Tách cận tại $1$: $\\int_0^1(1-x)dx+\\int_1^2(x-1)dx=\\dfrac12+\\dfrac12=1$.",
"dungChoCauChung": true
},
{
"id": "GT1-045",
"mon": "GT1",
"chuong": "GT1.6",
"doKho": 1,
"kieu": "mc",
"de": "Với $f(x,y)=x^2y+y^3$, $f'_x$ bằng",
"lua": [
"$2xy$",
"$x^2+3y^2$",
"$2xy+3y^2$",
"$2x$"
],
"dap": 0,
"giai": "Coi $y$ là hằng số: $(x^2y)'_x=2xy$, $(y^3)'_x=0$.",
"dungChoCauChung": true
},
{
"id": "GT1-046",
"mon": "GT1",
"chuong": "GT1.6",
"doKho": 2,
"kieu": "mc",
"de": "Với $f(x,y)=e^{xy}$, $f''_{xy}$ bằng",
"lua": [
"$xy\\,e^{xy}$",
"$(1+xy)\\,e^{xy}$",
"$e^{xy}$",
"$x^2e^{xy}$"
],
"dap": 1,
"giai": "$f'_x=ye^{xy}$; đạo hàm theo $y$: $e^{xy}+xy\\,e^{xy}$.",
"dungChoCauChung": true
},
{
"id": "GT1-047",
"mon": "GT1",
"chuong": "GT1.6",
"doKho": 1,
"kieu": "mc",
"de": "Vi phân toàn phần của $z=x^2+xy$ là",
"lua": [
"$dz=(2x+y)\\,dx+x\\,dy$",
"$dz=2x\\,dx+y\\,dy$",
"$dz=(2x+y)\\,dx+y\\,dy$",
"$dz=(2x+y)(dx+dy)$"
],
"dap": 0,
"giai": "$dz=z'_xdx+z'_ydy$ với $z'_x=2x+y$, $z'_y=x$.",
"dungChoCauChung": true
},
{
"id": "GT1-048",
"mon": "GT1",
"chuong": "GT1.6",
"doKho": 2,
"kieu": "mc",
"de": "$\\lim\\limits_{(x,y)\\to(0,0)}\\dfrac{xy}{x^2+y^2}$",
"lua": [
"bằng $0$",
"bằng $\\dfrac12$",
"bằng $1$",
"không tồn tại"
],
"dap": 3,
"giai": "Theo đường $y=kx$: giới hạn bằng $\\dfrac{k}{1+k^2}$, phụ thuộc $k$, nên không tồn tại.",
"dungChoCauChung": true
},
{
"id": "GT1-049",
"mon": "GT1",
"chuong": "GT1.6",
"doKho": 2,
"kieu": "tf",
"de": "Nếu $f(x,y)$ có các đạo hàm riêng tại $(x_0,y_0)$ thì $f$ khả vi tại đó.",
"lua": [
"Đúng",
"Sai"
],
"dap": 1,
"giai": "Có đạo hàm riêng chưa đủ. Ví dụ $f=\\dfrac{xy}{x^2+y^2}$, $f(0,0)=0$ có $f'_x=f'_y=0$ tại gốc nhưng không liên tục.",
"dungChoCauChung": true
},
{
"id": "GT1-050",
"mon": "GT1",
"chuong": "GT1.6",
"doKho": 2,
"kieu": "mc",
"de": "$\\lim\\limits_{(x,y)\\to(0,0)}\\dfrac{x^2y}{x^2+y^2}$ bằng",
"lua": [
"$0$",
"không tồn tại",
"$1$",
"$\\dfrac12$"
],
"dap": 0,
"giai": "$\\left|\\dfrac{x^2y}{x^2+y^2}\\right|\\le|y|\\to0$.",
"dungChoCauChung": true
},
{
"id": "GT1-051",
"mon": "GT1",
"chuong": "GT1.6",
"doKho": 1,
"kieu": "mc",
"de": "Gradient của $f=x^2+y^2$ tại $(1;2)$ là",
"lua": [
"$(1;2)$",
"$(2;4)$",
"$(4;2)$",
"$(2;2)$"
],
"dap": 1,
"giai": "$\\nabla f=(2x;2y)=(2;4)$ tại $(1;2)$.",
"dungChoCauChung": true
},
{
"id": "GT1-052",
"mon": "GT1",
"chuong": "GT1.7",
"doKho": 1,
"kieu": "mc",
"de": "Hàm $f(x,y)=x^2+y^2-2x$",
"lua": [
"đạt cực tiểu tại $(1;0)$",
"đạt cực đại tại $(1;0)$",
"đạt cực tiểu tại $(0;0)$",
"không có cực trị"
],
"dap": 0,
"giai": "$f=(x-1)^2+y^2-1\\ge-1$, dấu bằng tại $(1;0)$.",
"dungChoCauChung": true
},
{
"id": "GT1-053",
"mon": "GT1",
"chuong": "GT1.7",
"doKho": 2,
"kieu": "mc",
"de": "Với $f(x,y)=xy$, điểm $(0;0)$ là",
"lua": [
"điểm cực tiểu",
"điểm cực đại",
"điểm dừng nhưng không là cực trị",
"không phải điểm dừng"
],
"dap": 2,
"giai": "$f'_x=y$, $f'_y=x$ triệt tiêu tại gốc. $AC-B^2=0-1<0$ nên là điểm yên ngựa.",
"dungChoCauChung": true
},
{
"id": "GT1-054",
"mon": "GT1",
"chuong": "GT1.7",
"doKho": 2,
"kieu": "mc",
"de": "Giá trị lớn nhất của $x+y$ với điều kiện $x^2+y^2=2$ là",
"lua": [
"$\\sqrt2$",
"$2$",
"$1$",
"$4$"
],
"dap": 1,
"giai": "Lagrange: $1=2\\lambda x$, $1=2\\lambda y$ nên $x=y=\\pm1$. Lớn nhất bằng $2$ tại $(1;1)$.",
"dungChoCauChung": true
},
{
"id": "GT1-055",
"mon": "GT1",
"chuong": "GT1.7",
"doKho": 1,
"kieu": "tf",
"de": "Tại điểm dừng $M$, nếu $AC-B^2<0$ thì $M$ không là điểm cực trị ($A=f''_{xx}$, $B=f''_{xy}$, $C=f''_{yy}$).",
"lua": [
"Đúng",
"Sai"
],
"dap": 0,
"giai": "Định lý điều kiện đủ: $AC-B^2<0$ thì không có cực trị (điểm yên ngựa).",
"dungChoCauChung": true
},
{
"id": "GT1-056",
"mon": "GT1",
"chuong": "GT1.7",
"doKho": 1,
"kieu": "tf",
"de": "Tại điểm dừng, nếu $AC-B^2=0$ thì hàm chắc chắn không có cực trị tại đó.",
"lua": [
"Đúng",
"Sai"
],
"dap": 1,
"giai": "Trường hợp $AC-B^2=0$ chưa kết luận được. Ví dụ $x^4+y^4$ có cực tiểu tại gốc dù $AC-B^2=0$.",
"dungChoCauChung": true
},
{
"id": "GT1-057",
"mon": "GT1",
"chuong": "GT1.7",
"doKho": 1,
"kieu": "mc",
"de": "Giá trị nhỏ nhất của $x^2+y^2$ với điều kiện $x+y=2$ là",
"lua": [
"$2$",
"$4$",
"$1$",
"$\\sqrt2$"
],
"dap": 0,
"giai": "Thế $y=2-x$: $2x^2-4x+4=2(x-1)^2+2\\ge2$, đạt tại $(1;1)$.",
"dungChoCauChung": true
},
{
"id": "GT1-058",
"mon": "GT1",
"chuong": "GT1.7",
"doKho": 3,
"kieu": "mc",
"de": "Với $f(x,y)=x^3+y^3-3xy$, tại điểm $(1;1)$ hàm",
"lua": [
"đạt cực tiểu",
"đạt cực đại",
"không đạt cực trị",
"không có điểm dừng ở đó"
],
"dap": 0,
"giai": "$f'_x=3x^2-3y$, $f'_y=3y^2-3x$ triệt tiêu tại $(1;1)$. $A=6$, $B=-3$, $C=6$, $AC-B^2=27>0$, $A>0$ nên cực tiểu.",
"dungChoCauChung": false
},
{
"id": "GT1-B01",
"mon": "GT1",
"chuong": "GT1.4",
"doKho": 2,
"kieu": "buocsai",
"de": "Tính $\\displaystyle\\int x\\cos x\\,dx$. Bước nào sai?",
"lua": [
"Đặt $u=x$, $dv=\\cos x\\,dx$.",
"Suy ra $du=dx$, $v=\\sin x$.",
"$\\displaystyle\\int x\\cos x\\,dx=x\\sin x-\\int\\sin x\\,dx$.",
"$=x\\sin x-\\cos x+C$."
],
"dap": 3,
"giai": "$-\\int\\sin x\\,dx=-(-\\cos x)=+\\cos x$. Đúng là $x\\sin x+\\cos x+C$.",
"dungChoCauChung": false
},
{
"id": "GT1-B02",
"mon": "GT1",
"chuong": "GT1.3",
"doKho": 2,
"kieu": "buocsai",
"de": "Tính $\\lim\\limits_{x\\to0}\\dfrac{1-\\cos x}{x^2}$. Bước nào sai?",
"lua": [
"Dạng $\\dfrac00$, áp dụng L'Hôpital.",
"$=\\lim\\limits_{x\\to0}\\dfrac{-\\sin x}{2x}$.",
"$=-\\dfrac12\\lim\\limits_{x\\to0}\\dfrac{\\sin x}{x}$.",
"$=-\\dfrac12$."
],
"dap": 1,
"giai": "$(1-\\cos x)'=\\sin x$ (không có dấu trừ). Kết quả đúng là $\\dfrac12$.",
"dungChoCauChung": false
},
{
"id": "GT1-B03",
"mon": "GT1",
"chuong": "GT1.2",
"doKho": 1,
"kieu": "buocsai",
"de": "Tính đạo hàm của $y=\\sin(x^2)$. Bước nào sai?",
"lua": [
"Đặt $u=x^2$, khi đó $y=\\sin u$.",
"$y'_u=\\cos u$.",
"$y'_x=y'_u=\\cos(x^2)$.",
"Vậy $y'=\\cos(x^2)$."
],
"dap": 2,
"giai": "Quy tắc hàm hợp: $y'_x=y'_u\\cdot u'_x=2x\\cos(x^2)$.",
"dungChoCauChung": false
},
{
"id": "GT1-B04",
"mon": "GT1",
"chuong": "GT1.5",
"doKho": 3,
"kieu": "buocsai",
"de": "Tính $\\displaystyle\\int_{-1}^{1}\\frac{dx}{x^2}$. Bước nào sai?",
"lua": [
"Một nguyên hàm của $\\dfrac{1}{x^2}$ là $-\\dfrac1x$.",
"$\\displaystyle\\int_{-1}^{1}\\frac{dx}{x^2}=\\left[-\\frac1x\\right]_{-1}^{1}$.",
"$=-1-1=-2$.",
"Vậy tích phân bằng $-2$."
],
"dap": 1,
"giai": "Hàm không xác định tại $x=0\\in[-1;1]$: đây là tích phân suy rộng, không dùng Newton–Leibniz trực tiếp. Tách tại $0$ thì phân kỳ. (Dấu hiệu nghi ngờ: hàm dương mà tích phân âm!)",
"dungChoCauChung": false
},
{
"id": "GT1-B05",
"mon": "GT1",
"chuong": "GT1.7",
"doKho": 2,
"kieu": "buocsai",
"de": "Tìm cực trị của $f(x,y)=x^2-y^2$. Bước nào sai?",
"lua": [
"$f'_x=2x$, $f'_y=-2y$.",
"Điểm dừng duy nhất là $(0;0)$.",
"$A=2$, $B=0$, $C=-2$, nên $AC-B^2=-4$.",
"Vì $A>0$ nên $(0;0)$ là điểm cực tiểu."
],
"dap": 3,
"giai": "Chỉ xét dấu của $A$ khi $AC-B^2>0$. Ở đây $AC-B^2<0$ nên $(0;0)$ là điểm yên ngựa, không có cực trị.",
"dungChoCauChung": false
},
{
"id": "GT1-B06",
"mon": "GT1",
"chuong": "GT1.5",
"doKho": 1,
"kieu": "buocsai",
"de": "Tính $\\displaystyle\\int_0^1 2x\\,e^{x^2}dx$. Bước nào sai?",
"lua": [
"Đặt $t=x^2$, $dt=2x\\,dx$.",
"Đổi cận: $x=0\\Rightarrow t=0$; $x=1\\Rightarrow t=1$.",
"Tích phân $=\\displaystyle\\int_0^1e^t\\,dt$.",
"$=\\left.e^t\\right|_0^1=e$."
],
"dap": 3,
"giai": "$\\left.e^t\\right|_0^1=e-e^0=e-1$.",
"dungChoCauChung": false
},
{
"id": "DS-001",
"mon": "DS",
"chuong": "DS.1",
"doKho": 1,
"kieu": "mc",
"de": "Phần bù $\\overline{A\\cup B}$ bằng",
"lua": [
"$\\overline A\\cap\\overline B$",
"$\\overline A\\cup\\overline B$",
"$A\\cap B$",
"$\\overline A\\cap B$"
],
"dap": 0,
"giai": "Luật De Morgan: $\\overline{A\\cup B}=\\overline A\\cap\\overline B$.",
"dungChoCauChung": true
},
{
"id": "DS-002",
"mon": "DS",
"chuong": "DS.1",
"doKho": 1,
"kieu": "mc",
"de": "Phủ định của mệnh đề \"$\\forall x\\in\\mathbb R,\\ x^2\\ge0$\" là",
"lua": [
"\"$\\forall x\\in\\mathbb R,\\ x^2<0$\"",
"\"$\\exists x\\in\\mathbb R,\\ x^2<0$\"",
"\"$\\exists x\\in\\mathbb R,\\ x^2\\ge0$\"",
"\"$\\forall x\\in\\mathbb R,\\ x^2\\le0$\""
],
"dap": 1,
"giai": "Phủ định: đổi $\\forall$ thành $\\exists$ và phủ định vị từ.",
"dungChoCauChung": true
},
{
"id": "DS-003",
"mon": "DS",
"chuong": "DS.1",
"doKho": 1,
"kieu": "mc",
"de": "Mệnh đề $p\\Rightarrow q$ tương đương logic với",
"lua": [
"$p\\lor\\overline q$",
"$q\\Rightarrow p$",
"$\\overline p\\lor q$",
"$\\overline p\\Rightarrow\\overline q$"
],
"dap": 2,
"giai": "$p\\Rightarrow q$ chỉ sai khi $p$ đúng, $q$ sai, giống hệt $\\overline p\\lor q$.",
"dungChoCauChung": true
},
{
"id": "DS-004",
"mon": "DS",
"chuong": "DS.1",
"doKho": 1,
"kieu": "mc",
"de": "Ánh xạ $f:\\mathbb R\\to\\mathbb R$, $f(x)=x^2$ là",
"lua": [
"không đơn ánh, không toàn ánh",
"đơn ánh nhưng không toàn ánh",
"toàn ánh nhưng không đơn ánh",
"song ánh"
],
"dap": 0,
"giai": "$f(1)=f(-1)$ nên không đơn ánh; $-1$ không có tạo ảnh nên không toàn ánh.",
"dungChoCauChung": true
},
{
"id": "DS-005",
"mon": "DS",
"chuong": "DS.1",
"doKho": 1,
"kieu": "mc",
"de": "Ánh xạ ngược của $f:\\mathbb R\\to\\mathbb R$, $f(x)=2x+3$ là",
"lua": [
"$f^{-1}(y)=\\dfrac{y+3}{2}$",
"$f^{-1}(y)=\\dfrac{y-3}{2}$",
"$f^{-1}(y)=2y-3$",
"$f^{-1}(y)=\\dfrac{1}{2y+3}$"
],
"dap": 1,
"giai": "Giải $y=2x+3$ được $x=\\dfrac{y-3}{2}$.",
"dungChoCauChung": true
},
{
"id": "DS-006",
"mon": "DS",
"chuong": "DS.1",
"doKho": 1,
"kieu": "mc",
"de": "Tập $A$ có $3$ phần tử. Số tập con của $A$ là",
"lua": [
"$6$",
"$9$",
"$8$",
"$3$"
],
"dap": 2,
"giai": "Mỗi phần tử có 2 lựa chọn (có/không): $2^3=8$, kể cả $\\varnothing$ và $A$.",
"dungChoCauChung": true
},
{
"id": "DS-007",
"mon": "DS",
"chuong": "DS.1",
"doKho": 1,
"kieu": "tf",
"de": "Hợp thành của hai đơn ánh (khi hợp được) là một đơn ánh.",
"lua": [
"Đúng",
"Sai"
],
"dap": 0,
"giai": "$g(f(x_1))=g(f(x_2))\\Rightarrow f(x_1)=f(x_2)\\Rightarrow x_1=x_2$.",
"dungChoCauChung": true
},
{
"id": "DS-008",
"mon": "DS",
"chuong": "DS.1",
"doKho": 1,
"kieu": "mc",
"de": "Số ánh xạ từ tập $3$ phần tử vào tập $2$ phần tử là",
"lua": [
"$8$",
"$9$",
"$6$",
"$5$"
],
"dap": 0,
"giai": "Mỗi phần tử nguồn có $2$ cách chọn ảnh: $2^3=8$.",
"dungChoCauChung": true
},
{
"id": "DS-009",
"mon": "DS",
"chuong": "DS.1",
"doKho": 1,
"kieu": "mc",
"de": "Cho $A=\\{1,2,3\\}$, $B=\\{2,3,4\\}$. Hiệu $A\\setminus B$ là",
"lua": [
"$\\{1\\}$",
"$\\{4\\}$",
"$\\{1,4\\}$",
"$\\{2,3\\}$"
],
"dap": 0,
"giai": "Phần tử thuộc $A$ mà không thuộc $B$: chỉ có $1$. Còn $\\{1,4\\}$ là hiệu đối xứng.",
"dungChoCauChung": true
},
{
"id": "DS-010",
"mon": "DS",
"chuong": "DS.2",
"doKho": 1,
"kieu": "mc",
"de": "$i^{2026}$ bằng",
"lua": [
"$1$",
"$-1$",
"$i$",
"$-i$"
],
"dap": 1,
"giai": "$2026=4\\cdot506+2$ nên $i^{2026}=i^2=-1$.",
"dungChoCauChung": true
},
{
"id": "DS-011",
"mon": "DS",
"chuong": "DS.2",
"doKho": 1,
"kieu": "mc",
"de": "Mô-đun $|3+4i|$ bằng",
"lua": [
"$5$",
"$7$",
"$25$",
"$\\sqrt7$"
],
"dap": 0,
"giai": "$\\sqrt{3^2+4^2}=5$.",
"dungChoCauChung": true
},
{
"id": "DS-012",
"mon": "DS",
"chuong": "DS.2",
"doKho": 1,
"kieu": "mc",
"de": "Số phức liên hợp của $\\dfrac1i$ là",
"lua": [
"$-i$",
"$i$",
"$1$",
"$-1$"
],
"dap": 1,
"giai": "$\\dfrac1i=\\dfrac{i}{i^2}=-i$, liên hợp là $i$.",
"dungChoCauChung": true
},
{
"id": "DS-013",
"mon": "DS",
"chuong": "DS.2",
"doKho": 1,
"kieu": "mc",
"de": "Dạng lượng giác của $z=-2$ là",
"lua": [
"$2(\\cos0+i\\sin0)$",
"$-2(\\cos\\pi+i\\sin\\pi)$",
"$2(\\cos\\pi+i\\sin\\pi)$",
"$2\\left(\\cos\\frac{\\pi}{2}+i\\sin\\frac{\\pi}{2}\\right)$"
],
"dap": 2,
"giai": "$|z|=2$, $\\arg z=\\pi$. Mô-đun trong dạng lượng giác luôn không âm.",
"dungChoCauChung": true
},
{
"id": "DS-014",
"mon": "DS",
"chuong": "DS.2",
"doKho": 1,
"kieu": "mc",
"de": "Số nghiệm phức (kể cả bội) của phương trình $z^5=1$ là",
"lua": [
"$5$",
"$1$",
"$2$",
"vô số"
],
"dap": 0,
"giai": "Đa thức bậc $5$ có đúng $5$ nghiệm phức kể cả bội: $z_k=e^{2k\\pi i/5}$, $k=0,\\dots,4$.",
"dungChoCauChung": true
},
{
"id": "DS-015",
"mon": "DS",
"chuong": "DS.2",
"doKho": 1,
"kieu": "mc",
"de": "$\\dfrac{1+i}{1-i}$ bằng",
"lua": [
"$-i$",
"$1$",
"$i$",
"$1+i$"
],
"dap": 2,
"giai": "Nhân liên hợp: $\\dfrac{(1+i)^2}{2}=\\dfrac{2i}{2}=i$.",
"dungChoCauChung": true
},
{
"id": "DS-016",
"mon": "DS",
"chuong": "DS.2",
"doKho": 1,
"kieu": "tf",
"de": "Với mọi $z\\in\\mathbb C$: $z\\cdot\\overline z=|z|^2$.",
"lua": [
"Đúng",
"Sai"
],
"dap": 0,
"giai": "$(a+bi)(a-bi)=a^2+b^2=|z|^2$.",
"dungChoCauChung": true
},
{
"id": "DS-017",
"mon": "DS",
"chuong": "DS.2",
"doKho": 1,
"kieu": "mc",
"de": "Các căn bậc hai phức của $-4$ là",
"lua": [
"$\\pm2i$",
"$\\pm2$",
"không có",
"$\\pm4i$"
],
"dap": 0,
"giai": "$(2i)^2=-4$. Trên $\\mathbb C$ mọi số đều có căn bậc hai.",
"dungChoCauChung": true
},
{
"id": "DS-018",
"mon": "DS",
"chuong": "DS.2",
"doKho": 2,
"kieu": "mc",
"de": "Nghiệm của $z^2+2z+5=0$ là",
"lua": [
"$1\\pm2i$",
"$-1\\pm2i$",
"$-1\\pm4i$",
"$-2\\pm i$"
],
"dap": 1,
"giai": "$\\Delta'=1-5=-4=(2i)^2$, nên $z=-1\\pm2i$.",
"dungChoCauChung": true
},
{
"id": "DS-019",
"mon": "DS",
"chuong": "DS.3",
"doKho": 1,
"kieu": "mc",
"de": "$A$ cỡ $2\\times3$, $B$ cỡ $3\\times4$. Tích $AB$ có cỡ",
"lua": [
"$2\\times4$",
"$3\\times3$",
"$4\\times2$",
"không nhân được"
],
"dap": 0,
"giai": "$(m\\times n)(n\\times p)$ cho $m\\times p$.",
"dungChoCauChung": true
},
{
"id": "DS-020",
"mon": "DS",
"chuong": "DS.3",
"doKho": 1,
"kieu": "tf",
"de": "Với mọi ma trận vuông cùng cấp $A,B$: $AB=BA$.",
"lua": [
"Đúng",
"Sai"
],
"dap": 1,
"giai": "Phép nhân ma trận nói chung không giao hoán.",
"dungChoCauChung": true
},
{
"id": "DS-021",
"mon": "DS",
"chuong": "DS.3",
"doKho": 2,
"kieu": "mc",
"de": "$A$ vuông cấp $3$, $\\det A=5$. Khi đó $\\det(2A)$ bằng",
"lua": [
"$10$",
"$40$",
"$30$",
"$80$"
],
"dap": 1,
"giai": "$\\det(kA)=k^n\\det A=2^3\\cdot5=40$.",
"dungChoCauChung": true
},
{
"id": "DS-022",
"mon": "DS",
"chuong": "DS.3",
"doKho": 1,
"kieu": "mc",
"de": "$\\det(A^T)$ bằng",
"lua": [
"$\\det A$",
"$-\\det A$",
"$\\dfrac{1}{\\det A}$",
"$(\\det A)^2$"
],
"dap": 0,
"giai": "Định thức không đổi qua phép chuyển vị.",
"dungChoCauChung": true
},
{
"id": "DS-023",
"mon": "DS",
"chuong": "DS.3",
"doKho": 1,
"kieu": "mc",
"de": "Đổi chỗ hai hàng của ma trận vuông thì định thức",
"lua": [
"không đổi",
"đổi dấu",
"bằng $0$",
"nhân $2$"
],
"dap": 1,
"giai": "Tính chất phản đối xứng của định thức.",
"dungChoCauChung": true
},
{
"id": "DS-024",
"mon": "DS",
"chuong": "DS.3",
"doKho": 1,
"kieu": "mc",
"de": "Với $A,B$ khả nghịch cùng cấp, $(AB)^{-1}$ bằng",
"lua": [
"$A^{-1}B^{-1}$",
"$A^{-1}+B^{-1}$",
"$B^{-1}A^{-1}$",
"$AB^{-1}$"
],
"dap": 2,
"giai": "$(AB)(B^{-1}A^{-1})=I$. Thứ tự bị đảo ngược.",
"dungChoCauChung": true
},
{
"id": "DS-025",
"mon": "DS",
"chuong": "DS.3",
"doKho": 2,
"kieu": "mc",
"de": "Hệ thuần nhất $AX=0$ ($A$ vuông cấp $n$) có nghiệm không tầm thường khi và chỉ khi",
"lua": [
"$\\det A=0$",
"$\\det A\\ne0$",
"$A=0$",
"$n$ chẵn"
],
"dap": 0,
"giai": "$\\det A\\ne0$ thì chỉ có nghiệm $X=0$; $\\det A=0$ thì $r(A)<n$, có vô số nghiệm.",
"dungChoCauChung": true
},
{
"id": "DS-026",
"mon": "DS",
"chuong": "DS.3",
"doKho": 1,
"kieu": "mc",
"de": "Định lý Kronecker–Capelli: hệ $AX=B$ có nghiệm khi và chỉ khi",
"lua": [
"$r(A)<r(\\overline A)$",
"$r(A)=r(\\overline A)$",
"$r(A)=n$",
"$\\det A\\ne0$"
],
"dap": 1,
"giai": "$\\overline A$ là ma trận mở rộng. Có nghiệm khi và chỉ khi hai hạng bằng nhau.",
"dungChoCauChung": true
},
{
"id": "DS-027",
"mon": "DS",
"chuong": "DS.3",
"doKho": 2,
"kieu": "mc",
"de": "Hệ thuần nhất $3$ phương trình, $4$ ẩn",
"lua": [
"luôn có vô số nghiệm",
"có thể vô nghiệm",
"luôn có nghiệm duy nhất",
"có thể chỉ có nghiệm tầm thường"
],
"dap": 0,
"giai": "$r(A)\\le3<4$ ẩn và hệ thuần nhất luôn có nghiệm, nên có vô số nghiệm.",
"dungChoCauChung": true
},
{
"id": "DS-028",
"mon": "DS",
"chuong": "DS.3",
"doKho": 1,
"kieu": "mc",
"de": "$\\det\\begin{pmatrix}2&5&7\\\\0&3&1\\\\0&0&-1\\end{pmatrix}$ bằng",
"lua": [
"$6$",
"$-6$",
"$4$",
"$-42$"
],
"dap": 1,
"giai": "Ma trận tam giác: định thức bằng tích đường chéo $2\\cdot3\\cdot(-1)=-6$.",
"dungChoCauChung": true
},
{
"id": "DS-029",
"mon": "DS",
"chuong": "DS.3",
"doKho": 1,
"kieu": "mc",
"de": "$A$ khả nghịch. Khi đó $\\det(A^{-1})$ bằng",
"lua": [
"$\\det A$",
"$-\\det A$",
"$\\dfrac{1}{\\det A}$",
"$\\dfrac{n}{\\det A}$"
],
"dap": 2,
"giai": "$\\det A\\cdot\\det A^{-1}=\\det I=1$.",
"dungChoCauChung": true
},
{
"id": "DS-030",
"mon": "DS",
"chuong": "DS.3",
"doKho": 1,
"kieu": "tf",
"de": "Ma trận vuông $A$ khả nghịch khi và chỉ khi $\\det A\\ne0$.",
"lua": [
"Đúng",
"Sai"
],
"dap": 0,
"giai": "Định lý cơ bản về ma trận nghịch đảo.",
"dungChoCauChung": true
},
{
"id": "DS-031",
"mon": "DS",
"chuong": "DS.4",
"doKho": 1,
"kieu": "mc",
"de": "Số chiều của không gian $P_n[x]$ (đa thức bậc $\\le n$) là",
"lua": [
"$n+1$",
"$n$",
"$n-1$",
"vô hạn"
],
"dap": 0,
"giai": "Cơ sở $\\{1,x,\\dots,x^n\\}$ có $n+1$ vectơ.",
"dungChoCauChung": true
},
{
"id": "DS-032",
"mon": "DS",
"chuong": "DS.4",
"doKho": 1,
"kieu": "mc",
"de": "Số chiều của không gian ma trận thực cỡ $2\\times3$ là",
"lua": [
"$5$",
"$6$",
"$3$",
"$2$"
],
"dap": 1,
"giai": "Cơ sở gồm $6$ ma trận đơn vị $E_{ij}$.",
"dungChoCauChung": true
},
{
"id": "DS-033",
"mon": "DS",
"chuong": "DS.4",
"doKho": 1,
"kieu": "mc",
"de": "Hệ vectơ $\\{(1;2),(2;4)\\}$ trong $\\mathbb R^2$",
"lua": [
"phụ thuộc tuyến tính",
"độc lập tuyến tính",
"là một cơ sở của $\\mathbb R^2$",
"sinh ra $\\mathbb R^2$"
],
"dap": 0,
"giai": "$(2;4)=2(1;2)$.",
"dungChoCauChung": true
},
{
"id": "DS-034",
"mon": "DS",
"chuong": "DS.4",
"doKho": 1,
"kieu": "tf",
"de": "Trong $\\mathbb R^3$, mọi hệ gồm $4$ vectơ đều phụ thuộc tuyến tính.",
"lua": [
"Đúng",
"Sai"
],
"dap": 0,
"giai": "Hệ độc lập tuyến tính trong không gian $3$ chiều có nhiều nhất $3$ vectơ.",
"dungChoCauChung": true
},
{
"id": "DS-035",
"mon": "DS",
"chuong": "DS.4",
"doKho": 2,
"kieu": "mc",
"de": "Tập nào là không gian con của $\\mathbb R^2$?",
"lua": [
"$\\{(x;y):\\ y=2x+1\\}$",
"$\\{(x;y):\\ y=2x\\}$",
"$\\{(x;y):\\ x\\ge0\\}$",
"$\\{(x;y):\\ xy=0\\}$"
],
"dap": 1,
"giai": "Không gian con phải chứa $0$ và đóng với phép cộng, phép nhân vô hướng. Chỉ đường thẳng qua gốc thoả mãn.",
"dungChoCauChung": true
},
{
"id": "DS-036",
"mon": "DS",
"chuong": "DS.4",
"doKho": 2,
"kieu": "mc",
"de": "Hệ thuần nhất $n$ ẩn có ma trận hệ số hạng $r$. Không gian nghiệm có số chiều",
"lua": [
"$n-r$",
"$r$",
"$n$",
"$n+r$"
],
"dap": 0,
"giai": "Số ẩn tự do bằng $n-r$.",
"dungChoCauChung": true
},
{
"id": "DS-037",
"mon": "DS",
"chuong": "DS.4",
"doKho": 1,
"kieu": "tf",
"de": "Hợp của hai không gian con là một không gian con.",
"lua": [
"Đúng",
"Sai"
],
"dap": 1,
"giai": "Ví dụ trục $Ox\\cup Oy$ không đóng với phép cộng: $(1;0)+(0;1)=(1;1)$. Giao thì luôn là không gian con.",
"dungChoCauChung": true
},
{
"id": "DS-038",
"mon": "DS",
"chuong": "DS.4",
"doKho": 2,
"kieu": "mc",
"de": "Toạ độ của $v=(3;5)$ trong cơ sở $e_1=(1;1)$, $e_2=(0;1)$ là",
"lua": [
"$(3;5)$",
"$(2;3)$",
"$(3;2)$",
"$(5;3)$"
],
"dap": 2,
"giai": "$a(1;1)+b(0;1)=(a;a+b)=(3;5)$ nên $a=3$, $b=2$.",
"dungChoCauChung": true
},
{
"id": "DS-039",
"mon": "DS",
"chuong": "DS.4",
"doKho": 1,
"kieu": "mc",
"de": "Hệ $\\{(1;0;0),(1;1;0),(1;1;1)\\}$ trong $\\mathbb R^3$",
"lua": [
"là một cơ sở của $\\mathbb R^3$",
"phụ thuộc tuyến tính",
"không sinh ra $\\mathbb R^3$",
"chỉ sinh ra một mặt phẳng"
],
"dap": 0,
"giai": "Ma trận tam giác có định thức $1\\ne0$: độc lập tuyến tính, $3$ vectơ trong $\\mathbb R^3$.",
"dungChoCauChung": true
},
{
"id": "DS-040",
"mon": "DS",
"chuong": "DS.5",
"doKho": 1,
"kieu": "mc",
"de": "Ánh xạ nào sau đây là tuyến tính?",
"lua": [
"$f(x;y)=(x+y;\\ 2x)$",
"$f(x;y)=(x+1;\\ y)$",
"$f(x;y)=(xy;\\ x)$",
"$f(x;y)=(x^2;\\ y)$"
],
"dap": 0,
"giai": "Chỉ ánh xạ đầu có các thành phần là tổ hợp tuyến tính của $x,y$. $(x+1;y)$ không biến $0$ thành $0$.",
"dungChoCauChung": true
},
{
"id": "DS-041",
"mon": "DS",
"chuong": "DS.5",
"doKho": 2,
"kieu": "mc",
"de": "$f:\\mathbb R^3\\to\\mathbb R^2$ tuyến tính và toàn ánh. Khi đó $\\dim\\operatorname{Ker}f$ bằng",
"lua": [
"$1$",
"$0$",
"$2$",
"$3$"
],
"dap": 0,
"giai": "$\\dim\\operatorname{Ker}f=3-\\dim\\operatorname{Im}f=3-2=1$.",
"dungChoCauChung": true
},
{
"id": "DS-042",
"mon": "DS",
"chuong": "DS.5",
"doKho": 1,
"kieu": "mc",
"de": "Với $f:V\\to W$ tuyến tính, $V$ hữu hạn chiều, ta luôn có",
"lua": [
"$\\dim V=\\dim\\operatorname{Ker}f-\\dim\\operatorname{Im}f$",
"$\\dim V=\\dim\\operatorname{Ker}f+\\dim\\operatorname{Im}f$",
"$\\dim W=\\dim\\operatorname{Ker}f+\\dim\\operatorname{Im}f$",
"$\\dim V=\\dim\\operatorname{Im}f$"
],
"dap": 1,
"giai": "Định lý về số chiều (hạng + số khuyết).",
"dungChoCauChung": true
},
{
"id": "DS-043",
"mon": "DS",
"chuong": "DS.5",
"doKho": 1,
"kieu": "tf",
"de": "Ánh xạ tuyến tính $f$ là đơn ánh khi và chỉ khi $\\operatorname{Ker}f=\\{0\\}$.",
"lua": [
"Đúng",
"Sai"
],
"dap": 0,
"giai": "$f(u)=f(v)\\Leftrightarrow f(u-v)=0\\Leftrightarrow u-v\\in\\operatorname{Ker}f$.",
"dungChoCauChung": true
},
{
"id": "DS-044",
"mon": "DS",
"chuong": "DS.5",
"doKho": 2,
"kieu": "mc",
"de": "Ma trận (trong cơ sở chính tắc) của phép quay góc $90^\\circ$ ngược chiều kim đồng hồ trong $\\mathbb R^2$ là",
"lua": [
"$\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$",
"$\\begin{pmatrix}0&1\\\\-1&0\\end{pmatrix}$",
"$\\begin{pmatrix}1&0\\\\0&-1\\end{pmatrix}$",
"$\\begin{pmatrix}-1&0\\\\0&-1\\end{pmatrix}$"
],
"dap": 0,
"giai": "$e_1\\mapsto(0;1)$, $e_2\\mapsto(-1;0)$; ảnh của các vectơ cơ sở viết thành CỘT.",
"dungChoCauChung": true
},
{
"id": "DS-045",
"mon": "DS",
"chuong": "DS.5",
"doKho": 2,
"kieu": "mc",
"de": "Phép đạo hàm $D:P_3[x]\\to P_3[x]$, $D(p)=p'$. Số chiều của $\\operatorname{Ker}D$ là",
"lua": [
"$1$",
"$0$",
"$3$",
"$4$"
],
"dap": 0,
"giai": "$\\operatorname{Ker}D$ là các đa thức hằng, có cơ sở $\\{1\\}$.",
"dungChoCauChung": true
},
{
"id": "DS-046",
"mon": "DS",
"chuong": "DS.5",
"doKho": 1,
"kieu": "tf",
"de": "Mọi ánh xạ tuyến tính đều biến vectơ $0$ thành vectơ $0$.",
"lua": [
"Đúng",
"Sai"
],
"dap": 0,
"giai": "$f(0)=f(0\\cdot0)=0\\cdot f(0)=0$.",
"dungChoCauChung": true
},
{
"id": "DS-047",
"mon": "DS",
"chuong": "DS.5",
"doKho": 1,
"kieu": "mc",
"de": "Ánh xạ $f:\\mathbb R^2\\to\\mathbb R^2$, $f(x;y)=(x+y;\\ x+y)$ có hạng bằng",
"lua": [
"$1$",
"$2$",
"$0$",
"$3$"
],
"dap": 0,
"giai": "$\\operatorname{Im}f$ sinh bởi $(1;1)$, nên $\\dim\\operatorname{Im}f=1$.",
"dungChoCauChung": true
},
{
"id": "DS-048",
"mon": "DS",
"chuong": "DS.6",
"doKho": 1,
"kieu": "mc",
"de": "Trị riêng của $\\begin{pmatrix}2&1\\\\0&3\\end{pmatrix}$ là",
"lua": [
"$1$ và $4$",
"$2$ và $3$",
"$2$ và $1$",
"$0$ và $5$"
],
"dap": 1,
"giai": "Ma trận tam giác: trị riêng là các phần tử trên đường chéo.",
"dungChoCauChung": true
},
{
"id": "DS-049",
"mon": "DS",
"chuong": "DS.6",
"doKho": 1,
"kieu": "tf",
"de": "Tổng các trị riêng (kể cả bội, trên $\\mathbb C$) của ma trận vuông bằng vết của nó.",
"lua": [
"Đúng",
"Sai"
],
"dap": 0,
"giai": "Hệ số của $\\lambda^{n-1}$ trong đa thức đặc trưng cho $\\sum\\lambda_i=\\operatorname{tr}A$.",
"dungChoCauChung": true
},
{
"id": "DS-050",
"mon": "DS",
"chuong": "DS.6",
"doKho": 1,
"kieu": "mc",
"de": "Tích các trị riêng (kể cả bội, trên $\\mathbb C$) của $A$ bằng",
"lua": [
"$\\det A$",
"$\\operatorname{tr}A$",
"$r(A)$",
"$1$"
],
"dap": 0,
"giai": "Thay $\\lambda=0$ vào $\\det(A-\\lambda I)=\\prod(\\lambda_i-\\lambda)$ được $\\det A=\\prod\\lambda_i$.",
"dungChoCauChung": true
},
{
"id": "DS-051",
"mon": "DS",
"chuong": "DS.6",
"doKho": 1,
"kieu": "mc",
"de": "$A$ có trị riêng $\\lambda$ ứng với vectơ riêng $v$. Khi đó $A^2$ có trị riêng",
"lua": [
"$2\\lambda$",
"$\\lambda^2$",
"$\\lambda$",
"$\\sqrt\\lambda$"
],
"dap": 1,
"giai": "$A^2v=A(\\lambda v)=\\lambda^2v$.",
"dungChoCauChung": true
},
{
"id": "DS-052",
"mon": "DS",
"chuong": "DS.6",
"doKho": 1,
"kieu": "tf",
"de": "Ma trận vuông cấp $n$ có $n$ trị riêng thực phân biệt thì chéo hoá được trên $\\mathbb R$.",
"lua": [
"Đúng",
"Sai"
],
"dap": 0,
"giai": "Các vectơ riêng ứng với trị riêng phân biệt độc lập tuyến tính, đủ $n$ vectơ.",
"dungChoCauChung": true
},
{
"id": "DS-053",
"mon": "DS",
"chuong": "DS.6",
"doKho": 1,
"kieu": "tf",
"de": "Mọi ma trận vuông thực đều chéo hoá được trên $\\mathbb R$.",
"lua": [
"Đúng",
"Sai"
],
"dap": 1,
"giai": "Ví dụ $\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$ chỉ có một vectơ riêng độc lập.",
"dungChoCauChung": true
},
{
"id": "DS-054",
"mon": "DS",
"chuong": "DS.6",
"doKho": 2,
"kieu": "mc",
"de": "Ma trận $\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$",
"lua": [
"không chéo hoá được",
"chéo hoá được",
"có hai trị riêng phân biệt",
"có trị riêng $0$"
],
"dap": 0,
"giai": "Trị riêng kép $\\lambda=1$ nhưng $\\dim\\operatorname{Ker}(A-I)=1<2$.",
"dungChoCauChung": true
},
{
"id": "DS-055",
"mon": "DS",
"chuong": "DS.6",
"doKho": 1,
"kieu": "mc",
"de": "Một vectơ riêng ứng với $\\lambda=3$ của $\\begin{pmatrix}3&0\\\\0&1\\end{pmatrix}$ là",
"lua": [
"$(0;1)$",
"$(1;0)$",
"$(1;1)$",
"$(3;1)$"
],
"dap": 1,
"giai": "$A(1;0)^T=(3;0)^T=3(1;0)^T$.",
"dungChoCauChung": true
},
{
"id": "DS-056",
"mon": "DS",
"chuong": "DS.7",
"doKho": 1,
"kieu": "mc",
"de": "Ma trận đối xứng của dạng toàn phương $q=x^2+4xy+3y^2$ là",
"lua": [
"$\\begin{pmatrix}1&2\\\\2&3\\end{pmatrix}$",
"$\\begin{pmatrix}1&4\\\\4&3\\end{pmatrix}$",
"$\\begin{pmatrix}1&4\\\\0&3\\end{pmatrix}$",
"$\\begin{pmatrix}1&2\\\\2&-3\\end{pmatrix}$"
],
"dap": 0,
"giai": "Hệ số của $xy$ chia đôi cho hai vị trí đối xứng: $a_{12}=a_{21}=2$.",
"dungChoCauChung": true
},
{
"id": "DS-057",
"mon": "DS",
"chuong": "DS.7",
"doKho": 1,
"kieu": "mc",
"de": "Tiêu chuẩn Sylvester: dạng toàn phương xác định dương khi và chỉ khi",
"lua": [
"mọi định thức con chính góc trái đều dương",
"mọi phần tử đường chéo đều dương",
"định thức của ma trận dương",
"vết của ma trận dương"
],
"dap": 0,
"giai": "$D_1>0, D_2>0,\\dots,D_n>0$.",
"dungChoCauChung": true
},
{
"id": "DS-058",
"mon": "DS",
"chuong": "DS.7",
"doKho": 1,
"kieu": "tf",
"de": "Dạng toàn phương xác định dương khi và chỉ khi mọi trị riêng của ma trận đối xứng của nó đều dương.",
"lua": [
"Đúng",
"Sai"
],
"dap": 0,
"giai": "Đưa về dạng chính tắc bằng phép biến đổi trực giao: $q=\\sum\\lambda_iy_i^2$.",
"dungChoCauChung": true
},
{
"id": "DS-059",
"mon": "DS",
"chuong": "DS.7",
"doKho": 1,
"kieu": "mc",
"de": "Tích vô hướng chính tắc của $u=(1;2;-1)$ và $v=(3;0;1)$ là",
"lua": [
"$2$",
"$4$",
"$0$",
"$-2$"
],
"dap": 0,
"giai": "$1\\cdot3+2\\cdot0+(-1)\\cdot1=2$.",
"dungChoCauChung": true
},
{
"id": "DS-060",
"mon": "DS",
"chuong": "DS.7",
"doKho": 1,
"kieu": "mc",
"de": "Độ dài (chuẩn Euclid) của $(1;2;2)$ là",
"lua": [
"$5$",
"$3$",
"$9$",
"$\\sqrt5$"
],
"dap": 1,
"giai": "$\\sqrt{1+4+4}=3$.",
"dungChoCauChung": true
},
{
"id": "DS-061",
"mon": "DS",
"chuong": "DS.7",
"doKho": 1,
"kieu": "tf",
"de": "Trong không gian Euclid, hai vectơ khác $0$ và trực giao với nhau thì độc lập tuyến tính.",
"lua": [
"Đúng",
"Sai"
],
"dap": 0,
"giai": "Nếu $au+bv=0$, nhân vô hướng với $u$ được $a\\|u\\|^2=0\\Rightarrow a=0$; tương tự $b=0$.",
"dungChoCauChung": true
},
{
"id": "DS-062",
"mon": "DS",
"chuong": "DS.7",
"doKho": 1,
"kieu": "mc",
"de": "Bất đẳng thức Cauchy–Schwarz phát biểu",
"lua": [
"$|\\langle u,v\\rangle|\\le\\|u\\|\\,\\|v\\|$",
"$|\\langle u,v\\rangle|\\ge\\|u\\|\\,\\|v\\|$",
"$|\\langle u,v\\rangle|=\\|u\\|\\,\\|v\\|$",
"$\\|u+v\\|\\ge\\|u\\|+\\|v\\|$"
],
"dap": 0,
"giai": "Dấu bằng xảy ra khi và chỉ khi $u,v$ phụ thuộc tuyến tính.",
"dungChoCauChung": true
},
{
"id": "DS-063",
"mon": "DS",
"chuong": "DS.7",
"doKho": 1,
"kieu": "mc",
"de": "$Q$ là ma trận trực giao. Khi đó $Q^{-1}$ bằng",
"lua": [
"$Q$",
"$Q^T$",
"$-Q$",
"$(\\det Q)\\,Q$"
],
"dap": 1,
"giai": "Định nghĩa: $Q^TQ=I$.",
"dungChoCauChung": true
},
{
"id": "DS-B01",
"mon": "DS",
"chuong": "DS.3",
"doKho": 2,
"kieu": "buocsai",
"de": "Tính $\\det\\begin{pmatrix}1&2&0\\\\0&1&3\\\\2&0&1\\end{pmatrix}$ bằng khai triển theo hàng 1. Bước nào sai?",
"lua": [
"$\\det=1\\cdot A_{11}+2\\cdot A_{12}+0\\cdot A_{13}$ ($A_{ij}$ là phần bù đại số).",
"$A_{11}=\\begin{vmatrix}1&3\\\\0&1\\end{vmatrix}=1$.",
"$A_{12}=\\begin{vmatrix}0&3\\\\2&1\\end{vmatrix}=-6$.",
"$\\det=1\\cdot1+2\\cdot(-6)=-11$."
],
"dap": 2,
"giai": "Quên dấu $(-1)^{1+2}$: $A_{12}=-\\begin{vmatrix}0&3\\\\2&1\\end{vmatrix}=6$. Định thức đúng là $1+12=13$.",
"dungChoCauChung": false
},
{
"id": "DS-B02",
"mon": "DS",
"chuong": "DS.3",
"doKho": 1,
"kieu": "buocsai",
"de": "Tìm nghịch đảo của $A=\\begin{pmatrix}2&1\\\\5&3\\end{pmatrix}$. Bước nào sai?",
"lua": [
"$\\det A=2\\cdot3-1\\cdot5=1\\ne0$ nên $A$ khả nghịch.",
"Công thức $A^{-1}=\\dfrac{1}{\\det A}\\begin{pmatrix}d&-b\\\\-c&a\\end{pmatrix}$.",
"$A^{-1}=\\begin{pmatrix}3&1\\\\5&2\\end{pmatrix}$.",
"Vậy $A^{-1}$ như trên."
],
"dap": 2,
"giai": "Quên đổi dấu hai phần tử phụ: đúng là $\\begin{pmatrix}3&-1\\\\-5&2\\end{pmatrix}$.",
"dungChoCauChung": false
},
{
"id": "DS-B03",
"mon": "DS",
"chuong": "DS.2",
"doKho": 1,
"kieu": "buocsai",
"de": "Tính $(1+i)^2$. Bước nào sai?",
"lua": [
"$(1+i)^2=1+2i+i^2$.",
"Vì $i^2=1$ nên $(1+i)^2=1+2i+1$.",
"$=2+2i$.",
"Do đó $|(1+i)^2|=2\\sqrt2$."
],
"dap": 1,
"giai": "$i^2=-1$, nên $(1+i)^2=2i$ và $|2i|=2$.",
"dungChoCauChung": false
},
{
"id": "DS-B04",
"mon": "DS",
"chuong": "DS.6",
"doKho": 2,
"kieu": "buocsai",
"de": "Tìm trị riêng của $A=\\begin{pmatrix}4&1\\\\2&3\\end{pmatrix}$. Bước nào sai?",
"lua": [
"Phương trình đặc trưng $\\det(A-\\lambda I)=0$.",
"$(4-\\lambda)(3-\\lambda)-2=0$.",
"$\\lambda^2-7\\lambda+14=0$.",
"$\\Delta<0$ nên $A$ không có trị riêng thực."
],
"dap": 2,
"giai": "$(4-\\lambda)(3-\\lambda)-2=\\lambda^2-7\\lambda+10$, nghiệm $\\lambda=2$, $\\lambda=5$.",
"dungChoCauChung": false
},
{
"id": "DS-B05",
"mon": "DS",
"chuong": "DS.3",
"doKho": 1,
"kieu": "buocsai",
"de": "Tìm hạng của ma trận có các hàng $(1;2;3)$, $(2;4;6)$, $(1;0;1)$. Bước nào sai?",
"lua": [
"$h_2\\to h_2-2h_1$: hàng 2 thành $(0;0;0)$.",
"$h_3\\to h_3-h_1$: hàng 3 thành $(0;-2;-2)$.",
"Đổi chỗ, ma trận bậc thang có 2 hàng khác $0$.",
"Vậy $r(A)=3$."
],
"dap": 3,
"giai": "Hạng bằng số hàng khác $0$ của dạng bậc thang: $r(A)=2$.",
"dungChoCauChung": false
},
{
"id": "DS-B06",
"mon": "DS",
"chuong": "DS.5",
"doKho": 1,
"kieu": "buocsai",
"de": "Kiểm tra $f(x;y)=(x+1;\\ y)$ có tuyến tính không. Bước nào sai?",
"lua": [
"Lấy $u=(x_1;y_1)$, $v=(x_2;y_2)$.",
"$f(u+v)=(x_1+x_2+1;\\ y_1+y_2)$.",
"$f(u)+f(v)=(x_1+x_2+2;\\ y_1+y_2)$.",
"Vì $f(u+v)=f(u)+f(v)$ nên $f$ tuyến tính."
],
"dap": 3,
"giai": "Hai kết quả khác nhau ($+1$ và $+2$), nên $f$ KHÔNG tuyến tính. Cũng thấy ngay $f(0)=(1;0)\\ne0$.",
"dungChoCauChung": false
}
];
