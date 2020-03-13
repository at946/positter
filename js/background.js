chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.sendMessage(tab.id, "clicked")
})

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    cotoha_api_base_url = "https://xxxxxxxxxx.com/" // COTOHA APIのアカウントホームページで確認

    // アクセストークンの払い出し
    if (request.contentScriptQuery == "get_access_token") {
      cotoha_access_token_publish_url = "https://xxxxxxxxxx.com/access_token" // COTOHA APIのアカウントホームページで確認
      cotoha_client_id = "xxxxxxxxxx" // COTOHA APIのアカウントホームページで確認
      cotoha_client_secret = "xxxxxxxxxx" // COTOHA APIのアカウントホームページで確認
  
    fetch(cotoha_access_token_publish_url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        grantType: "client_credentials",
        clientId: cotoha_client_id,
        clientSecret: cotoha_client_secret
      })
    })
    .then(response => response.json())
    .then(body => sendResponse(body.access_token))
    .catch(err => console.log(err))
    }

    // ツイートのネガポジ判定
    if (request.contentScriptQuery == "get_tweet_sentiment") {
      cotoha_sentiment_api_endpoint = "nlp/v1/sentiment"

      fetch(cotoha_api_base_url + cotoha_sentiment_api_endpoint, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${request.access_token}`
        },
        body: JSON.stringify({
          sentence: request.tweet
        })
      })
      .then(response => response.json())
      .then(body => {
        sendResponse(body.result.sentiment)
      })
      .catch(err => console.log(err))
    }

    // ポジティブでないツイートを松岡修造の熱い名言から最も近しいものに変える
    if (request.contentScriptQuery == "get_similar_shuzo_quote") {
      cotoha_similarity_api_endpoint = "nlp/v1/similarity"

      function get_similarity(s1, s2) {
        return new Promise((resolve, reject) => {
          fetch(cotoha_api_base_url + cotoha_similarity_api_endpoint, {
            method: 'POST',
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
              Authorization: `Bearer ${request.access_token}`
            },
            body: JSON.stringify({
              s1: s1,
              s2: s2
            })
          })
          .then(response => response.json())
          .then(body => resolve([s2, body.result.score]))
          .catch(err => console.log(err))
        })
      }

      Promise.all([
        get_similarity(request.tweet, "100回叩くと壊れる壁があったとする。でもみんな何回叩けば壊れるかわからないから、90回まで来ていても途中であきらめてしまう。"),
        get_similarity(request.tweet, "みんな！！竹になろうよ。竹ってさあ台風が来てもしなやかじゃない。台風負けないんだよ。雪が来てもね。おもいっきりそれを跳ね除ける！！力強さがあるんだよ。そう、みんな！！！竹になろう！！！バンブー！！！"),
        get_similarity(request.tweet, "ベストを尽くすだけでは勝てない。僕は勝ちにいく。"),
        get_similarity(request.tweet, "もっと熱くなれよ！熱い血燃やしてけよ！！人間熱くなったときがホントの自分に出会えるんだ！！"),
        get_similarity(request.tweet, "一番になるっていったよな？日本一なるっつったよな！ぬるま湯なんかつかってんじゃねぇよお前！！")
      ]).then((results) => {
        most_similar_quote = ["", 0] // [名言, 類似度(score)]
        for (result of results) {
          if (most_similar_quote[1] < result[1]) {
            most_similar_quote = result
          }
        }
        sendResponse(most_similar_quote[0])
      })
      .catch(err => console.log(err))
    }
    return true
  }
)