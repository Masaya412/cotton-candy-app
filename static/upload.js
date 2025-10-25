let dropArea = document.getElementById('drop-area');
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropArea.classList.add('highlight');
}

function unhighlight(e) {
    dropArea.classList.remove('highlight');
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    let dt = e.dataTransfer;
    let files = dt.files;

    handleFiles(files);
}

function handleFiles(files) {
    ([...files]).forEach(uploadFile);
}

function openFileDialog() {
    const gallery = document.getElementById('gallery');
    const currentImageCount = gallery.querySelectorAll('img').length;

    // 最大3枚までアップロード可能
    const maxImageCount = 3;

    // ファイル選択ダイアログを開く前に、既に3枚アップロードされている場合はアラートを表示
    if (currentImageCount >= maxImageCount) {
        alert(`一度にアップロードできるのは${maxImageCount}枚までです。`);
        return; // ダイアログを開かない
    }

    document.getElementById('fileElem').click();
}

function uploadFile(file) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = function() {
        let img = document.createElement('img');
        img.src = reader.result;
        img.file = file; // ファイル情報をimg要素に保存

        let removeButton = document.createElement('button');
        removeButton.textContent = '削除';
        removeButton.onclick = function() {
            img.parentNode.removeChild(img);
            removeButton.parentNode.removeChild(removeButton);
        };

        let container = document.createElement('div');
        container.appendChild(img);
        container.appendChild(removeButton);
        document.getElementById('gallery').appendChild(container);
    };
}

function uploadFiles() {
    // ボタンがクリックされたらloadingクラスを追加
    document.getElementById('uploadButton').classList.add('loading');

    let images = document.querySelectorAll('#gallery img');
    let uploadedCount = 0; // アップロード済み枚数をカウント

    // アップロード枚数によって処理を分岐
    if (images.length === 1) {
        // 1枚の画像の場合
        let img = images[0]; // 最初の画像を取得
        let url = '/upload';
        let formData = new FormData();
        formData.append('file_content', img.file);

        fetch(url, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // 予測結果に基づいて遷移先を決定
            if (data.classname === '雨雲') {
                document.getElementById('uploadButton').classList.remove('loading');
                window.location.href = `/RCloud/${img.file.name}`;
            } else {
                document.getElementById('uploadButton').classList.remove('loading');
                window.location.href = `/NCloud/${img.file.name}`;
            }
        })
        .catch(err => {
            document.getElementById('uploadButton').classList.remove('loading');
            console.error('Error uploading file:', err);
        });
    } else if (images.length >= 2 && images.length <= 3) {  // 2枚以上3枚以下の場合
        // 複数枚の画像の場合
        images.forEach(img => {
            let url = '/upload';
            let formData = new FormData();
            formData.append('file_content', img.file);

            fetch(url, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                uploadedCount++; // アップロード済み枚数をインクリメント

                // すべてアップロードされたらlist.htmlに遷移
                if (uploadedCount === images.length) {
                    document.getElementById('uploadButton').classList.remove('loading');
                    window.location.href = '/list';
                }
            })
            .catch(err => {
                document.getElementById('uploadButton').classList.remove('loading');
                console.error('Error uploading file:', err);
                alert('画像のアップロード中にエラーが発生しました。'); // エラーメッセージを表示
            });
        });
    } else {
        // 1枚でも2枚でも３枚でもない場合
        alert('画像を選択してください');
    }
}