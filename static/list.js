function deleteImage(filename) {
  // Flaskのdeleteルートにリクエストを送信
  fetch('/delete/' + filename, {
    method: 'POST'
  })
  .then(response => {
    if (response.ok) {
      // レスポンスが成功したら、画像を削除
      var imageBox = document.getElementById('imageBox_' + filename);
      if (imageBox) {
        imageBox.remove();
      }
    } else {
      console.error('画像の削除中にエラーが発生しました:', response.status);
    }
  })
  .catch(error => {
    console.error('画像の削除中にエラーが発生しました:', error);
  });
}

function deleteAllImages() {
  if (confirm("本当に全ての画像を削除しますか？")) {
      fetch('/delete_all', { method: 'POST' })
          .then(response => {
              if (response.ok) {
                  location.reload(); // ページをリロード
              } else {
                  console.error('全ての画像の削除中にエラーが発生しました:', response.status);
              }
          })
          .catch(error => {
              console.error('全ての画像の削除中にエラーが発生しました:', error);
          });
  }
}

function confirmClose() {
  if (confirm("アプリを終了しますか？")) {
    window.close();
  }
}