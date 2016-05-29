In order to prepare the knowledge base for the top 500 german verbs we need to do the next:
1. Visit the website https://quizlet.com/10088172/flashcards/embed
2. Run this script in the console:
```
var result = '';

Cards.data.terms.forEach(function(record) {
   result += '  '.repeat(0) + record.word.trim() + ':\n';
   result += '  '.repeat(1) + 'translation: \n';
   result += '  '.repeat(2) + 'ru-RU: ' + record.definition.trim() + '\n';
   result += '  '.repeat(2) + 'en-US: \n';
});

console.log(result);
```
3. Copy the output to the knowledge base to the file