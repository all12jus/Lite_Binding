const initApp = () => {
	var app = {
		$scope: {}, // this value can only change locally?
		// init: init,
		// render: render,
	};

	app.update$Scope = (key, value, doRender = false) => {
		app.$scope[key] = value;
		if (doRender) {
			app.render(key);
		}
	};
	const EXPRESSION_REGEX = new RegExp("{{[^{}]*}}", "g");
	const getRequiredVariables = (expression, localScope = {}) => {
		var code = `(function(){return ${expression};})();`;
		var hasNoError = false;
		var mergedScope = { ...app.$scope, ...localScope };
		var limitedScope = {};
		var triesLeft = Object.keys(mergedScope).length + 2;
		// only allow it go to count of items in mergedScope... too many failures.
		while (!hasNoError && triesLeft > 0) {
			try {
				var inter = new Interpreter(code, (interpreter, scope) => {
					Object.keys(limitedScope).forEach((key) => {
						interpreter.setProperty(scope, key, interpreter.nativeToPseudo(mergedScope[key]));
					});
				});
				inter.run();
				hasNoError = true;
			} catch (error) {
				// console.error(error);
				if (error instanceof ReferenceError) {
					const len = " is not defined".length;
					const variableName = error.message.substring(0, error.message.length - len);
					// console.warn(variableName);
					limitedScope[variableName] = mergedScope[variableName];
				}
				if (error instanceof SyntaxError) {
					console.error("Syntax Error in:" + expression);
					return [];
				}
			}
			triesLeft--;
		}
		// console.log(mergedScope);
		var inter = new Interpreter(code, (interpreter, scope) => {
			Object.keys(mergedScope).forEach((key) => {
				interpreter.setProperty(scope, key, interpreter.nativeToPseudo(mergedScope[key]));
			});
		});
		// console.info(expression + " <-in-> " + JSON.stringify(Object.keys(limitedScope)));
		return Object.keys(limitedScope);
	};

	const getVariablesFromExpressionList = (exps) => {
		var results = [];

		exps.forEach((exp) => {
			// console.log(exp);
			if (exp instanceof Array) {
				console.warn("is array");
				return;
			}
			var r = getRequiredVariables(exp);
			// console.log(r);
			r.forEach((e) => results.push(e));
		});
		return results;
	};

	const expressionsFromInnerHTML = (innerHTML) => {
		// console.log(innerHTML);
		var matches = innerHTML.match(EXPRESSION_REGEX);
		if (matches === undefined || matches === null || matches.length == 0) {
			return [];
		}
		var results = matches.map((e) => {
			return { regex: e, expression: e.substring(2, e.length - 2).trim() };
		});
		// console.log(results);
		if (results === undefined) {
			return [];
		} else {
			return results;
		}
	};

	const expressionsFromInnerText = (innerText) => {
		// console.log(innerText);
		var matches = innerText.match(EXPRESSION_REGEX);
		// console.log(matches);
		if (matches === undefined || matches === null || matches.length == 0) {
			// console.warn(matches);
			return [];
		}
		var results = matches.map((e) => {
			return { regex: e, expression: e.substring(2, e.length - 2).trim() };
		});
		// console.log(results);
		if (results === undefined) {
			return [];
		} else {
			return results;
		}
	};

	const addElementsToRegistered = (expressions, element) => {
		expressions.forEach((variableName) => {
			if (app.$scope[variableName] === undefined || app.$scope[variableName] === null) {
				// app.$scope[variableName] == "";
				app.update$Scope(variableName, "");
			}
			if (registeredElements[variableName] === undefined) {
				registeredElements[variableName] = [];
			}
			registeredElements[variableName].push(element);
		});
	};

	const processExpression = (expression, localScope = {}) => {
		var code = `(function(){return ${expression};})();`;
		// console.warn(app.$scope);
		var mergedScope = { ...app.$scope, ...localScope };
		// console.log(mergedScope);
		var inter = new Interpreter(code, (interpreter, scope) => {
			Object.keys(mergedScope).forEach((key) => {
				interpreter.setProperty(scope, key, interpreter.nativeToPseudo(mergedScope[key]));
			});
		});
		try {
			inter.run();
		} catch (error) {
			// return "";
			console.error(`Error: ${expression} ${error}`);
			if (error instanceof ReferenceError) {
				const len = " is not defined".length;
				// console.warn(error.message.substring(0, error.message.length - len));
				const variableName = error.message.substring(0, error.message.length - len);
				// console.warn(variableName);
				console.warn(`${variableName} == ${app.$scope[variableName]}`);
				// app.update$Scope(variableName, "");
			}
		}
		// return inter.value;
		return inter.pseudoToNative(inter.value);
	};

	const processAction = (expression, localScope = {}) => {
		// console.warn(app.$scope);
		var mergedScope = { ...app.$scope, ...localScope };
		// console.log(mergedScope);
		var result = "{";
		Object.keys(mergedScope).forEach((key) => {
			result += `${key}:${key},`;
		});
		result += "}";
		var code = `(function(){${expression};return ${result};})();`;
		var inter = new Interpreter(code, (interpreter, scope) => {
			Object.keys(mergedScope).forEach((key) => {
				interpreter.setProperty(scope, key, interpreter.nativeToPseudo(mergedScope[key]));
			});
		});
		try {
			inter.run();
		} catch (error) {
			console.warn(error);
			if (error instanceof ReferenceError) {
				const len = " is not defined".length;
				// console.warn(error.message.substring(0, error.message.length - len));
				const variableName = error.message.substring(0, error.message.length - len);
				console.warn(variableName);
			}
		}
		// console.log(inter);
		// return inter.value;
		// return inter;
		var result = inter.pseudoToNative(inter.value);
		// console.log(result);

		Object.keys(result).forEach((k) => {
			// console.log(`${k} = ${result[k]}`);
			app.update$Scope(k, result[k]);
			app.render(k);
		});

		return result;
	};

	const renderRepeatElement = (parent) => {
		// console.log(parent);

		// if (parent.innerHTML != "") {

		// }

		var t = parent.dataset.repeat.split(" in ");
		var variableName = t[0];
		var expression = t[1];
		// console.warn(expression);
		var values = processExpression(expression);
		// console.warn(values);
		var template = parent.dataset.template;
		var output = "";
		values.forEach((value, index) => {
			var temp = template;
			var matches = temp.match(EXPRESSION_REGEX).map((e) => {
				return { regex: e, expression: e.substring(2, e.length - 2).trim() };
			});
			var inject = {};
			inject[variableName] = value;
			inject["index"] = index;
			matches.forEach((match) => {
				var span = document.createElement("span");
				var val = processExpression(match.expression, inject);
				span.innerText = val;
				temp = temp.replace(match.regex, span.outerHTML);
			});
			// console.log(temp);
			output += temp;
		});
		// console.log(output);
		parent.innerHTML = output;

		// this sort of works but doesn't optimize.
		parent.querySelectorAll("[data-action]").forEach((elm) => {
			const expression = elm.dataset.action;
			// console.warn(expression);
			const variables = getVariablesFromExpressionList([expression]);
			// console.info(variables);
			elm.addEventListener("click", () => {
				// console.info(variables);
				elm.disabled = true;
				// alert(`${variables}`);
				var result = processAction(expression);
				// alert(JSON.stringify(result));
				// alert(`${elm.dataset.action} ==> ${result}`);
				console.log(result);
			});
			// console.error(elm);
			if (elm.click === undefined) {
				throw "No click handler where should be one.";
			}
			// alert(elm.click);
			// addElementsToRegistered(variables, elm); // this might not work...
		});
	};

	const renderIfElement = (elm) => {
		var result = processExpression(elm.dataset.if);
		// console.info(elm.dataset.if);
		// console.info(result);
		var temp = elm.dataset.iftemplate;
		var matches = elm.dataset.iftemplate.match(EXPRESSION_REGEX).map((e) => {
			return { regex: e, expression: e.substring(2, e.length - 2).trim() };
		});
		var inject = {};
		matches.forEach((match) => {
			var span = document.createElement("span");
			var val = processExpression(match.expression, inject);
			span.innerText = val;
			temp = temp.replace(match.regex, span.outerHTML);
		});

		var content = temp;
		elm.innerHTML = result ? content : "";
	};

	const renderBoundElement = (elm) => {
		var result = processExpression(elm.dataset.bind);
		elm.innerHTML = result ? result : "";
	};

	const renderModelElement = (elm) => {
		// console.log(elm.dataset);
		// alert(elm.dataset.model);
		var result = processExpression(elm.dataset.model);
		elm.value = result ? result : "";
	};

	const renderDisableElement = (elm) => {
		var result = processExpression(elm.dataset.disabled);
		console.log(result);
		elm.dataset.disres = result;
		elm.disabled = result;
	};

	const renderVariableName = (varName) => {
		if (app.$scope[varName] === undefined || app.$scope[varName] === null) {
			// app.$scope[varName] == "";
			app.update$Scope(varName, "");
		}
		registeredElements[varName].forEach((elm) => {
			// console.log(elm);

			// console.log(elm.dataset);
			if (elm.dataset.repeat !== undefined && elm.dataset.repeat !== "") {
				renderRepeatElement(elm);
			} else if (elm.dataset.if !== undefined && elm.dataset.if !== "") {
				renderIfElement(elm);
			} else if (elm.dataset.bind !== undefined && elm.dataset.bind !== "") {
				renderBoundElement(elm);
			} else if (elm.dataset.model !== undefined && elm.dataset.model !== "") {
				renderModelElement(elm);
			} // else

			if (elm.dataset.disabled !== undefined && elm.dataset.disabled !== "") {
				renderDisableElement(elm);
			}
		});
	};

	const initDataAction = () => {};

	const IGNORE_TAGS = ["BODY", "HTML", "SCRIPT", "TITLE", "META", "HEAD", "BUTTON"];
	const processChildren = (element) => {
		var index = IGNORE_TAGS.indexOf(element.tagName);
		if (index == -1) {
			// console.log(element);
			if (element.innerText !== null && element.innerText != "" && element.dataset.bind != "" && element.children.length == 0) {
				// element.dataset.bind = element.innerText;
				var expressions = expressionsFromInnerText(element.innerText);
				// console.log(element.innerText);
				// console.warn(`${element.innerText} -> ${expressions}`);
				if (expressions == null || expressions == undefined) {
					// console.log(element);
					throw "Error";
				}
				// var matches = element.innerText.match(EXPRESSION_REGEX).map((e) => {
				// 	return { regex: e, expression: e.substring(2, e.length - 2).trim() };
				// });
				// console.log(matches);
				expressions.forEach((match) => {
					// console.log(match);
					var span = document.createElement("span");
					span.dataset.bind = match.expression;
					element.innerHTML = element.innerHTML.replace(match.regex, span.outerHTML);
					// console.log(element.innerHTML);
				});
			}
		} else {
			Array.from(element.children).forEach((el) => processChildren(el));
		}
	};

	var registeredElements = {
		// "variableName": [ element1, element2]
		// should also handle if the $scope[variableName] === undefined
	};
	// var $scope = {};

	app.init = () => {
		// console.log(app.$scope);

		// data-repeat
		document.querySelectorAll("[data-repeat]").forEach((elm) => {
			elm.dataset.template = elm.innerHTML.trim();
			// console.log(elm.dataset.template);
			var expression = elm.dataset.repeat.split(" in ")[1];
			var input = [expression];
			var htmlExps = expressionsFromInnerHTML(elm.dataset.template);
			htmlExps.forEach((e) => {
				// console.info(e);
				input.push(e.expression);
			});
			const expressions = getVariablesFromExpressionList(input);
			// console.log(expressions);
			elm.innerHTML = "";
			addElementsToRegistered(expressions, elm);
		});
		// data-if
		document.querySelectorAll("[data-if]").forEach((elm) => {
			console.log(elm);
			elm.dataset.iftemplate = elm.innerHTML.trim();
			var input = [elm.dataset.if];
			var htmlExps = expressionsFromInnerHTML(elm.dataset.iftemplate);
			console.log(input);
			console.log(htmlExps);
			htmlExps.forEach((e) => {
				console.info(e);
				input.push(e.expression);
			});
			const expressions = getVariablesFromExpressionList(input);
			elm.innerHTML = "";
			addElementsToRegistered(expressions, elm);
		});
		// covert innerHTML -> data-bind
		const allElements = document.querySelectorAll("*");
		allElements.forEach((e) => {
			// console.log(e);
			processChildren(e);
			// then have to add something to these to tell it what it needs for each children
		});
		// data-bind
		document.querySelectorAll("span[data-bind]").forEach((elm) => {
			//
			var expression = elm.dataset.bind;
			var variables = getVariablesFromExpressionList([expression]);
			addElementsToRegistered(variables, elm);
		});
		// data-model
		document.querySelectorAll("[data-model]").forEach((elm) => {
			// console.log(elm);
			var expression = elm.dataset.model;
			var variables = getVariablesFromExpressionList([expression]);
			addElementsToRegistered(variables, elm);
			elm.addEventListener("keyup", () => {
				app.$scope[elm.dataset.model] = elm.value;
				app.render(elm.dataset.model);
			});
		});

		// if you try to render it after the fact??
		document.querySelectorAll("[data-action]").forEach((elm) => {
			//
			const expression = elm.dataset.action;
			// console.warn(expression);
			const variables = getVariablesFromExpressionList([expression]);
			// console.info(variables);
			elm.addEventListener("click", () => {
				// console.info(variables);
				elm.disabled = true;
				// alert(`${variables}`);
				var result = processAction(expression);
				// alert(result);
				// alert(`${elm.dataset.action} ==> ${result}`);
				console.log(result);
			});
			console.error(elm);
			if (elm.click === undefined) {
				throw "No click handler where should be one.";
			}
			// alert(elm.click);
			addElementsToRegistered(variables, elm);
		});

		document.querySelectorAll("[data-disabled]").forEach((elm) => {
			const expression = elm.dataset.disabled;

			console.warn(expression);
			var variables = getVariablesFromExpressionList([expression]);
			addElementsToRegistered(variables, elm);
		});
	};
	app.render = (changedVarName) => {
		// handle an array?
		// console.log()
		console.log(registeredElements);
		if (changedVarName !== undefined && changedVarName !== "") {
			console.log(changedVarName);
			renderVariableName(changedVarName);
			console.log(registeredElements[changedVarName]);
		} else {
			console.log("Do all in registered.");
			Object.keys(registeredElements).forEach((e) => renderVariableName(e));
		}
		console.log(app.$scope);
	};
	return app;
};
