import os
import glob
import re
import torch
from flask import Flask, request, render_template, jsonify, send_file
from torchvision import transforms
from PIL import Image

# Flask アプリの初期化
app = Flask(__name__)

# --- 設定 ---
LABEL_LIST = ["雨雲ではない", "雨雲"]
IMAGE_SIZE = 224
MODEL_PATH = os.path.join("model", "model_efficientnet_b0.pth")  # モデルファイルへのパス

# --- 前処理 ---
test_transforms = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor()
])

# --- モデルの読み込み ---
model = torch.load(MODEL_PATH, map_location=torch.device('cpu'), weights_only=False)
model.eval()

# --- 推論用辞書 ---
predicts = {}

# --- 推論関数 ---
def predict_image(file):
    image = Image.open(file).convert("RGB")
    image = test_transforms(image).unsqueeze(0)
    with torch.no_grad():
        output = torch.sigmoid(model(image))
    n = output[0].argmax()
    return LABEL_LIST[n], output[0][n].item()

# --- ルート定義 ---

@app.route('/')
def start():
    delete_all()
    return render_template('start.html')

def get_list():
    imglst = [os.path.basename(fn) for fn in glob.glob('static/*')
              if re.search(r'\.(jpg|jpeg|png|JPG|JPEG|PNG)$', fn)]
    imgdata = []
    for imgfile in imglst:
        try:
            score = predicts[imgfile][1]
            imgdata.append({'filename': imgfile, 'classname': predicts[imgfile][0], 'score': score * 100})
        except KeyError:
            imgdata.append({'filename': imgfile, 'classname': 'unknown', 'score': 0.0})
    return imgdata

@app.route('/list')
def list_page():
    return render_template('list.html', imglst=get_list())

@app.route('/image/<filename>')
def image(filename):
    return render_template('image.html', name=filename)

@app.route('/upload.html')
def upload_page():
    return render_template('upload.html')

@app.route('/upload', methods=['POST'])
def regist():
    file = request.files['file_content']
    path = os.path.join('./static', file.filename)
    file.save(path)
    predicts[file.filename] = predict_image(path)
    return jsonify({'classname': predicts[file.filename][0], 'score': predicts[file.filename][1]})

@app.route('/RCloud/<filename>')
def RCloud(filename):
    classname, score = predicts[filename]
    return render_template('RCloud.html', filename=filename, classname=classname, score=score)

@app.route('/NCloud/<filename>')
def NCloud(filename):
    classname, score = predicts[filename]
    return render_template('NCloud.html', filename=filename, classname=classname, score=score)

@app.route('/delete/<filename>', methods=['POST'])
def delete(filename):
    filepath = os.path.join('./static', filename)
    if os.path.exists(filepath):
        os.remove(filepath)
        predicts.pop(filename, None)
        return jsonify({'status': 'success'})
    else:
        return jsonify({'status': 'error', 'message': 'ファイルが見つかりません'}), 404

@app.route('/delete_all', methods=['POST'])
def delete_all():
    for filename in os.listdir('static'):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            try:
                os.remove(os.path.join('static', filename))
            except OSError:
                pass
    predicts.clear()
    return jsonify({'status': 'success'})

# --- アプリ起動 ---
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
