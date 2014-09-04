# Flickr Tag Search

### How to run
#### 1. First clone the repository to you local folder

```shell
git clone git@github.com:nealxyc/flickr-tag-search.git
cd flickr-tag-search
```

#### 2. Then install npm dependecies

```shell
npm install
```

#### 3. Change API key.
Put in your Flickr API key and secret in `api_key.js` file.

```js
// Put in your api_key and secret here.
module.exports = {
	apiKey: "api-key",
	secret: "secret"
};
```

#### 4. Start the server

```shell
npm start
```
