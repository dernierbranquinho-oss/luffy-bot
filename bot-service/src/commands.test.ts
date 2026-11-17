import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matchesCommand,packageReply} from './commands.ts';
test('accepts lowercase',()=>assert.equal(matchesCommand('tabela',{name:'T',aliases:'TABELA',active:true}),true));
test('ignores spaces',()=>assert.equal(matchesCommand('  T  ',{name:'T',aliases:'TABELA',active:true}),true));
test('inactive commands do not respond',()=>assert.equal(matchesCommand('T',{name:'T',aliases:'TABELA',active:false}),false));
test('no invented prices or packages',()=>assert.equal(packageReply([]),'Ainda não existem pacotes disponíveis nesta categoria.'));
