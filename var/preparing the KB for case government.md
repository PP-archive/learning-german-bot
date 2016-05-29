In order to prepare the knowledge base for the case government we need to do the next:
1. Visit the website http://appossum.com/dictation/settings/deru_Laguna_A2/deru_Laguna_A2_2_Rektionsverben_presnd
2. Run this script in the console:
```javascript
var result = '';
$('#appos_dictation_settings tr:not(.appos_dictation_settings_header)').each(function(k, v) {
    var verb = $(v).find('.appos_dictation_settings_term_pretxt').text();
    var caseGovernment = $(v).find('.appos_dictation_settings_term_value').text().split(',');

    result += verb.toLowerCase()+':\n';
    result += '  '.repeat(1)+'translation:\n';

    result += '  '.repeat(1)+'case government:\n';

    caseGovernment.forEach(function(value) {
        var tmp = value.split('+');
        var verbPlusPreposition = tmp[0].trim();
        var verbCase = tmp[1].trim();
        result += '  '.repeat(2)+verbPlusPreposition.toLowerCase()+':\n';
        result += '  '.repeat(3)+'case: '+verbCase+'\n';
        result += '  '.repeat(3)+'translation:'+'\n';
        result += '  '.repeat(4)+'ru-RU:'+'\n';
        result += '  '.repeat(4)+'en-US:'+'\n';
        result += '  '.repeat(3)+'example:'+'\n';
    });
});

console.log(result);
```
3. Copy the output to the knowledge base to the file