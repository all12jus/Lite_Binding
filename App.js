// https://www.json-generator.com/
// [
//     '{{repeat(5, 7)}}',
//     {
//         first: '{{firstName()}}',
//         last: '{{surname()}}',
//         email: '{{email()}}'
//     }
// ]

var tableData = [
	{
		first: "Freda",
		last: "Carlson",
		email: "fredacarlson@gmail.com",
	},
	{
		first: "Bernard",
		last: "Mccall",
		email: "bernardmccall@gmail.com",
	},
	{
		first: "Augusta",
		last: "Galloway",
		email: "augustagalloway@gmail.com",
	},
	{
		first: "Patterson",
		last: "Odonnell",
		email: "pattersonodonnell@gmail.com",
	},
	{
		first: "Blake",
		last: "Bernard",
		email: "blakebernard@gmail.com",
	},
	{
		first: "Kelly",
		last: "Nichols",
		email: "kellynichols@gmail.com",
	},
];

var names = ["Aaren", "Aarika", "Abagael"];

var Application = initApp();
// Application.update$Scope("items", [{ item: "Hello" }, { item: "Lol" }]);
// Application.scope = {
// 	items: [{ item: "Hello" }, { item: "Lol" }],
// };
// console.log(Application.$scope);
Application.init();
Application.update$Scope("items", names);
Application.update$Scope("value", "Hello");
Application.update$Scope("subscribers", tableData);
// console.log(Application.$scope);

Application.render();

// console.log(Application.testVal);
// Application.testFun();
// Application.testVal++;
// Application.testFun();
// console.log(Application.testVal);
// console.log(Application.$scope);
