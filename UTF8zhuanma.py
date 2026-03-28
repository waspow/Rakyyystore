input_file = r'D:\Argo\202412\202412.tar\ARGOMONTHLY\argometa_all.csv'
output_file = r'D:\Argo\202412\202412.tar\ARGOMONTHLY\argometa_all_utf8.csv'

# 常见情况先试 gbk，如果报错我再带你换别的
with open(input_file, 'r', encoding='gbk', errors='replace') as f:
    content = f.read()

with open(output_file, 'w', encoding='utf-8-sig', newline='') as f:
    f.write(content)

print('已生成：', output_file)
