In order to prepare the knowledge base for the top 200 german words we need to do the next:
1. Visit the website http://www.de-online.ru/news/top_200_samykh_ispolzuemykh_nemeckikh_slov/2013-06-22-150
2. Run this script in the console:
```
var result = '\n';
$('table.eBlock table:eq(0) ol').each(function(key, ol) {
    $(ol).find('li').each(function(key, li) {
        var word = $(li).find('b').text().trim().split(',').shift();
        if (!word) {
            return;
        }
        var translation = $(li).text().split('- ').pop().trim();
        result += word + ':\n';
        result += '  '.repeat(1) + 'translation: \n';
        result += '  '.repeat(2) + 'ru-RU: ' + translation + '\n';
        result += '  '.repeat(2) + 'en-US: \n';
        var genderMatches = word.match(/(der|die|das) /);
        if (genderMatches) {
            var gender;
            switch (genderMatches[1].toLowerCase()) {
                case 'die':
                    gender = 'f';
                    break;
                case 'der':
                    gender = 'm';
                    break;
                case 'das':
                    gender = 'n';
                    break;
            }
            result += '  '.repeat(1) + 'gender: ' + gender + '\n';
        }
    });
});

// one exception is the #140 word, it has incorrect markdown, so we add it manually
result += 'nach:\n';
result += '  '.repeat(1)+'translation: после\n'

console.log(result);
```
3. Copy the output to the knowledge base to the file