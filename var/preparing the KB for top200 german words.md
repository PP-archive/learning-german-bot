In order to prepare the knowledge base for the top 200 german words we need to do the next:
1. Visit the website
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
        result += '  '.repeat(2) + 'translation: ' + translation + '\n'
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
            result += '  '.repeat(2) + 'gender: ' + gender + '\n';
        }
    });
});
console.log(result);
```
3. Copy the output to the knowledge base file