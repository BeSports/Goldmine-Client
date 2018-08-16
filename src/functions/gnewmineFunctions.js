import _ from 'lodash';
import GnewmineStore from '../stores/GnewmineStore';
import base64 from 'base-64';
import axios from 'axios';

const gnewmineFunctions = {
  getAllSubscriptions() {
    const allSubscriptionNames = _.map(GnewmineStore.subscriptions, 'publicationNameWithParams');
    return allSubscriptionNames;
  },

  async sendSubscriptionReport(username) {
    const { socket } = GnewmineStore;

    const pusherChannels = _.orderBy(socket.channels.channels, ['name']);
    const gnewmineSubscriptions = _.orderBy(gnewmineFunctions.getAllSubscriptions());

    const attachments = [];

    // make attachment of every pusherChannel
    _.forEach(pusherChannels, channel => {
      let decoded = '';
      const [name, params] = _.split(channel.name, '_');
      decoded = base64.decode(params);
      attachments.push({
        title: `${name}?${decoded}`,
        fields: [
          {
            key: 'Pusher',
            value: `✅ Pusher (subscribed: ${channel.subscribed})`,
            short: true,
          },
          {
            key: 'Gnewmine-Client',
            value: '🚫 Gnewmine-Client',
            short: true,
          },
        ],
        color: '#ce2b2b',
      });
    });

    // iterate over gnewmineSubs
    _.forEach(gnewmineSubscriptions, sub => {
      const attachment = _.findIndex(attachments, ['title', sub]);
      if (attachment >= 0) {
        const gnewmineClientField = _.findIndex(attachments[attachment].fields, [
          'key',
          'Gnewmine-Client',
        ]);
        attachments[attachment].fields[gnewmineClientField].value = '✅ Gnewmine-Client';
        delete attachments[attachment].color;
      } else {
        attachments.push({
          title: sub,
          fields: [
            {
              key: 'Pusher',
              value: '🚫 Pusher',
              short: true,
            },
            {
              key: 'Gnewmine-Client',
              value: '✅ Gnewmine-Client',
              short: true,
            },
          ],
          color: '#ce2b2b',
        });
      }
    });

    // slack only allows 100 attachments per message
    const chunckedAttachments = _.chunk(attachments, 100);
    const url = 'https://hooks.slack.com/services/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';

    _.forEach(chunckedAttachments, async (chunk, i) => {
      try {
        const options = {
          method: 'POST',
          headers: {
            'Content-type': 'application/x-www-form-urlencoded',
          },
          url,
          json: true,
          data: {
            username: 'SubscriptionReportBot',
            icon_emoji: ':male-detective:',
            text: i === 0 ? `*${username || 'Someone'}* sent a subscription report` : undefined,
            attachments: chunk,
          },
        };
        await axios(options);
      } catch (e) {
        console.error('Failed to send slack message', e.response);
      }
    });
  },
};

export default gnewmineFunctions;
