const FormData = require('form-data');
const axios = require('axios');
const { createReadStream } = require('fs');
const { resolve } = require('path');

const regCheckURL = /^(http|https):\/\/[^ "]+$/;

module.exports.config = {
  name: "imgbb",
  version: "1.0",
  hasPermission: 0,
  credits: "Jubayer",
  description: "Upload an image or GIF to ImgBB and get the direct link",
  commandCategory: "utility",
  usages: "[image_url_or_reply_to_image]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  try {
    let imageStream;
    let isGif = false;

    if (event.messageReply?.attachments?.length > 0) {
      const attachment = event.messageReply.attachments[0];
      if (attachment.type === "photo" || attachment.type === "animated_image") {
        const response = await axios.get(attachment.url, { responseType: 'stream' });
        imageStream = response.data;
        isGif = attachment.type === "animated_image";
      }
    }
    else if (args[0] && regCheckURL.test(args[0])) {
      const response = await axios.get(args[0], { responseType: 'stream' });
      imageStream = response.data;
      isGif = args[0].toLowerCase().endsWith('.gif');
    } else {
      return api.sendMessage("[⚜️] • Please provide an image URL or reply to an image/GIF.", event.threadID, event.messageID);
    }

    if (!imageStream) {
      return api.sendMessage("Failed to get image stream ❌.", event.threadID, event.messageID);
    }

    const authResponse = await axios.get('https://imgbb.com');
    const auth_token = authResponse.data.match(/auth_token="([^"]+)"/)[1];

    const form = new FormData();
    form.append('source', imageStream);
    form.append('type', 'file');
    form.append('action', 'upload');
    form.append('timestamp', Date.now());
    form.append('auth_token', auth_token);

    const response = await axios.post('https://imgbb.com/json', form, {
      headers: {
        ...form.getHeaders()
      }
    });

    if (response.data.success) {
      const imageUrl = response.data.image.url;
      const finalUrl = isGif ? `${imageUrl}.gif` : `${imageUrl}.jpeg`;
      
      return api.sendMessage(`Image uploaded successfully!✅\n\nLink: ${finalUrl}`, event.threadID, event.messageID);
    } else {
      return api.sendMessage("Failed to upload image to ImgBB ⁉️.", event.threadID, event.messageID);
    }
  } catch (error) {
    console.error(error);
    return api.sendMessage("An error occurred while uploading the image.", event.threadID, event.messageID);
  }
};
