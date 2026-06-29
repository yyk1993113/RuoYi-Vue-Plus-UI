#!/usr/bin/env python3
"""上传 dist.tgz 到阿里云 OSS 并打印一个 1 小时有效的预签名 GET URL。
纯标准库实现 OSS V1 签名，不依赖 ossutil。
入参全走环境变量：OSS_AK_ID / OSS_AK_SECRET / OSS_BUCKET / OSS_ENDPOINT / OBJ / LOCAL_FILE(默认 dist.tgz)。
上传失败会抛异常（步骤变红）；成功则 stdout 仅输出预签名 URL。"""
import os, time, hmac, hashlib, base64, email.utils, urllib.request, urllib.parse

ak = os.environ['OSS_AK_ID']
sk = os.environ['OSS_AK_SECRET'].encode()
bucket = os.environ['OSS_BUCKET']
ep = os.environ['OSS_ENDPOINT']
obj = os.environ['OBJ']
local = os.environ.get('LOCAL_FILE', 'dist.tgz')

host = f"{bucket}.{ep}"
ctype = "application/gzip"
data = open(local, "rb").read()

# --- PUT 上传（OSS V1 签名）---
date = email.utils.formatdate(usegmt=True)
sts = f"PUT\n\n{ctype}\n{date}\n/{bucket}/{obj}"
sig = base64.b64encode(hmac.new(sk, sts.encode(), hashlib.sha1).digest()).decode()
req = urllib.request.Request(
    f"https://{host}/{obj}", data=data, method="PUT",
    headers={"Date": date, "Content-Type": ctype,
             "Content-Length": str(len(data)), "Authorization": f"OSS {ak}:{sig}"})
urllib.request.urlopen(req, timeout=120).read()

# --- 生成预签名 GET URL（OSS V1）---
exp = int(time.time()) + 3600
sts2 = f"GET\n\n\n{exp}\n/{bucket}/{obj}"
sig2 = base64.b64encode(hmac.new(sk, sts2.encode(), hashlib.sha1).digest()).decode()
print(f"https://{host}/{obj}?OSSAccessKeyId={ak}&Expires={exp}"
      f"&Signature={urllib.parse.quote(sig2, safe='')}")
