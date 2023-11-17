var _extends=Object.assign||function(target){for(var i=1;i<arguments.length;i++){var source=arguments[i];for(var key in source){if(Object.prototype.hasOwnProperty.call(source,key)){target[key]=source[key];}}}return target;};var _rhsCommon=require("rhs-common");var _DBCommon=require("./DBCommon");var _DBQuery=require("./DBQuery");function _defineProperty(obj,key,value){if(key in obj){Object.defineProperty(obj,key,{value:value,enumerable:true,configurable:true,writable:true});}else{obj[key]=value;}return obj;}var isNumber=_rhsCommon.PureFunctions.isNumber,isDate=_rhsCommon.PureFunctions.isDate,isBoolean=_rhsCommon.PureFunctions.isBoolean,aggregateDifferences=_rhsCommon.PureFunctions.aggregateDifferences,isJSONObject=_rhsCommon.PureFunctions.isJSONObject,mergeOldWithChangesForComputation=_rhsCommon.PureFunctions.mergeOldWithChangesForComputation,getChangesFromMergedData=_rhsCommon.PureFunctions.getChangesFromMergedData,getRecordWithId=_rhsCommon.PureFunctions.getRecordWithId,computeInternally=_rhsCommon.PureFunctions.computeInternally,resolveValue=_rhsCommon.PureFunctions.resolveValue,getNullOrObject=_rhsCommon.PureFunctions.getNullOrObject,getNestedFields=_rhsCommon.PureFunctions.getNestedFields,getFieldType=_rhsCommon.PureFunctions.getFieldType,getSchema=_rhsCommon.PureFunctions.getSchema,getRelations=_rhsCommon.PureFunctions.getRelations,getSubQueries=_rhsCommon.PureFunctions.getSubQueries,getSubModels=_rhsCommon.PureFunctions.getSubModels,getSubModelObjects=_rhsCommon.PureFunctions.getSubModelObjects,getReferenceFields=_rhsCommon.PureFunctions.getReferenceFields,getNestedComputations=_rhsCommon.PureFunctions.getNestedComputations,getComputations=_rhsCommon.PureFunctions.getComputations,isChangeExist=_rhsCommon.PureFunctions.isChangeExist,validateDataPipeline=_rhsCommon.PureFunctions.validateDataPipeline,mergeQueryFields=_rhsCommon.PureFunctions.mergeQueryFields,getValidations=_rhsCommon.PureFunctions.getValidations,getNestedValidations=_rhsCommon.PureFunctions.getNestedValidations;var mapRelationValue=function mapRelationValue(value,data,relation,references){var reference=relation.reference,_relation$self=relation.self,self=_relation$self===undefined?"_id":_relation$self;if(self!=="_id"&&typeof self==="string"&&references&&references[self]){self=self+"._id";}var selfValue=resolveValue(data,self);if(!selfValue){throw new Error("While insertion relation data parent value not found >>> Value is "+JSON.stringify(value)+" >>> parent is "+JSON.stringify(data));}var newValue=_extends({},value,_defineProperty({},reference,{_id:selfValue}));return newValue;};var convertIncIntoNormal=function convertIncIntoNormal(value){var newValue={};for(var k in value){var v=value[k];if(v&&typeof v=="object"&&v.hasOwnProperty("$inc")){newValue[k]=v["$inc"];}else{newValue[k]=v;}}return newValue;};var convertIntoSetUnsetAndInc=function convertIntoSetUnsetAndInc(value){var newValue={};for(var k in value){var v=value[k];if(v===null||v===undefined){newValue["$unset"]=newValue["$unset"]||{};newValue["$unset"][k]=1;}else if(typeof v=="object"&&v.hasOwnProperty("$inc")){newValue["$inc"]=newValue["$inc"]||{};newValue["$inc"][k]=v["$inc"];}else{newValue["$set"]=newValue["$set"]||{};newValue["$set"][k]=v;}}return newValue;};var getRelationChanges=function getRelationChanges(data,relationChanges,relations,references,schema,old){var pipeline=_rhsCommon.Pipeline.of("Push Relation Changes");Object.keys(relationChanges).forEach(function(k){var value=relationChanges[k];var oldValue=old&&old[k];var oldValueMap=oldValue&&oldValue.reduce(function(prev,curr){prev[curr._id]=curr;return prev;},{});var insertOp=value.insert,updateOp=value.update,removeOp=value.remove;if(insertOp){var newInserts=insertOp.map(function(doc){return mapRelationValue(doc,data,relations[k],references);});newInserts.forEach(function(newValue){if(!newValue._id){throw new Error("_id must be required in insert but not found, can be new_ or any other insert op found "+JSON.stringify(newValue)+" ");}pipeline.add(function(){return insert((0,_DBCommon.getReferenceTable)(k,schema),newValue);});});}if(updateOp){updateOp.forEach(function(updateValue){var _id=updateValue._id,changes=updateValue.changes;if(!changes){throw new Error("In relation array update changes must be required but not found >> field>>>"+k+" >>> provided >>>>"+JSON.stringify(updateValue));}pipeline.add(function(){return update((0,_DBCommon.getReferenceTable)(k,schema),{_id:_id},changes,void 0,{old:oldValueMap&&oldValueMap[_id]});},function(param){return param;});});}if(removeOp){removeOp.forEach(function(removeValue){var _id=removeValue._id;pipeline.add(function(){return remove((0,_DBCommon.getReferenceTable)(k,schema),{_id:_id},{old:oldValueMap&&oldValueMap[_id]});},function(param){return param;});});}});return pipeline;};var getSaveQuery=function getSaveQuery(data,model,arrayFields,aggregates,computations,triggers,validations,saveQueryFields,subModelObjects,nestedComputations,nestedValidations){var insertOp=data.insert,updateOp=data.update,removeOp=data.remove,upsertOp=data.upsert;if(insertOp){return null;}var queryFilter=null;saveQueryFields=saveQueryFields?_extends({},saveQueryFields):{};saveQueryFields["__txs__"]=1;if(removeOp||updateOp||upsertOp){setOldValueFields(model,saveQueryFields);}var schema=model._schema;var subModels=getSubModels(schema);var values=updateOp?updateOp.changes:upsertOp?upsertOp.value:{};for(var k in values){var fieldValue=values[k];if(arrayFields&&arrayFields[k]){var fieldType=getFieldType(schema,k);if(fieldType._isModel&&!(subModels&&subModels[k])){saveQueryFields[k]=saveQueryFields[k]||{};setOldValueFields(fieldType,saveQueryFields[k]);}}}if(updateOp||removeOp){var _ref=updateOp?updateOp:removeOp,_id=_ref._id;queryFilter={_id:_id};}else if(upsertOp){var filter=upsertOp.filter;queryFilter=filter;saveQueryFields["_id"]=1;}saveQueryFields=mergeQueryRequiredFields(aggregates,saveQueryFields);saveQueryFields=mergeQueryRequiredFields(triggers,saveQueryFields);saveQueryFields=mergeQueryRequiredFields(validations,saveQueryFields);saveQueryFields=mergeQueryRequiredFields(computations,saveQueryFields);saveQueryFields=mergeQueryRequiredNestedFields(nestedComputations,saveQueryFields,subModelObjects);saveQueryFields=mergeQueryRequiredNestedFields(nestedValidations,saveQueryFields,subModelObjects);if(!Object.keys(saveQueryFields).length){saveQueryFields=null;}if(saveQueryFields){if(!saveQueryFields["_id"]){saveQueryFields["_id"]=1;}var saveQuery=_rhsCommon.Query.of().fields(saveQueryFields).filter(queryFilter).only();return saveQuery;}else{return null;}};var setOldValueFields=function setOldValueFields(model,saveQueryFields){var schema=model._schema;var relations=getRelations(model);var subQueries=getSubQueries(model);var volatiles=(0,_DBCommon.getVolatiles)(model);var subModels=getSubModels(schema);for(var field in schema){if(relations&&relations[field]){continue;}else if(subQueries&&subQueries[field]){continue;}else if(volatiles&&volatiles[field]){continue;}else if(subModels&&subModels[field]){saveQueryFields[field]=saveQueryFields[field]||{};setOldValueFields(subModels[field],saveQueryFields[field]);}else{saveQueryFields[field]=1;}}};var runTransformation=function runTransformation(id,transformation,model,param,args){var data=param.data;var pipeline=_rhsCommon.Pipeline.of("Db connect - Transform - "+id).param({});var _effect=transformation._effect,_onChange=transformation._onChange,_require=transformation._require;var fields=getNullOrObject(_require)||getNullOrObject(_onChange);if(!fields["_id"]){fields["_id"]=1;}pipeline.add((0,_DBQuery.find)(model,_rhsCommon.Query.of().fields(fields).filter({_id:data._id}).only(),args));pipeline.add(function(_ref2){var result=_ref2.result;result=_effect(result);if(!result){return param;}var _result=result,type=_result.type,reference=_result.reference,value=_result.value;var model=(0,_DBCommon.getModelFromType)(type);var filter=_defineProperty({},reference,{_id:data._id});var upsertValue=_extends({},value,filter);return save(model,{upsert:{filter:filter,value:upsertValue}},args);},function(){return param;});return pipeline;};var transform=function transform(transformations,param,model,nestedFields,args){var pipeline=_rhsCommon.Pipeline.of("Db connect - Transform");var changeFields=param.changeFields;for(var k in transformations){var transformation=transformations[k];var _onChange=transformation._onChange;if(isChangeExist(changeFields,_onChange,nestedFields)){pipeline.add(runTransformation(k,transformation,model,param,args));}}return pipeline;};var runTrigger=function runTrigger(triggers,param,nestedFields,args){var data=param.data,old=param.old,changeFields=param.changeFields,user=param.user,op=param.op,_id=param._id;var pipeline=_rhsCommon.Pipeline.of("Db connect - Trigger");var _loop=function _loop(k){var trigger=triggers[k];var _invoke=trigger._invoke,_onChange=trigger._onChange;if(isChangeExist(changeFields,_onChange,nestedFields)){pipeline.add(function(){return(0,_DBCommon.invoke)(_invoke,{data:data,old:old,changeFields:changeFields,user:user,op:op,_id:_id},args);});}};for(var k in triggers){_loop(k);}return pipeline;};var aggregate=function aggregate(aggregates,param,nestedFields,args){var data=param.data,old=param.old,changeFields=param.changeFields,op=param.op;var pipeline=_rhsCommon.Pipeline.of("Db connect - Aggregate");var _loop2=function _loop2(k){var aggregate=aggregates[k];var _effect=aggregate._effect,_onChange=aggregate._onChange,_invoke=aggregate._invoke;if(isChangeExist(changeFields,_onChange,nestedFields)||op==="remove"){var newResult=null;if(op!=="remove"){newResult=_effect(data);}var _ref3=newResult||{},newType=_ref3.type,newUpsert=_ref3.upsert;var oldResult=null;if(old){oldResult=_effect(old);}var _ref4=oldResult||{},oldType=_ref4.type,oldUpsert=_ref4.upsert;var diffResult=aggregateDifferences(newUpsert,oldUpsert);if(diffResult){if(_invoke){pipeline.add(function(){if(typeof _invoke==="function"){return _invoke({data:data,upsert:diffResult},args);}else{return(0,_DBCommon.invoke)(_invoke,{data:data,upsert:diffResult},args);}},function(param){return param;});}else{diffResult.forEach(function(diff){var newModel=newType&&(0,_DBCommon.getModelFromType)(newType);var oldModel=oldType&&(0,_DBCommon.getModelFromType)(oldType);var model=newModel||oldModel;var filter=diff.filter,value=diff.value;pipeline.add(function(){return save(model,{upsert:{filter:filter,value:value}},args);},function(param){return param;});});}}}};for(var k in aggregates){_loop2(k);}return pipeline;};var getNestedModel=function getNestedModel(model){if(Array.isArray(model)){model=model[0];}return(0,_DBCommon.getModelFromType)(model);};var getValueId=function getValueId(valId){if(typeof valId=="string"&&valId.startsWith("new_")){valId=(0,_DBCommon.getUniqueObjectId)();}else if(valId){valId=(0,_DBCommon.getObjectId)(valId);}else{valId=(0,_DBCommon.getUniqueObjectId)();}return valId;};var getReferenceId=function getReferenceId(field,schema,value,args){var query=_rhsCommon.Query.of().fields({_id:1}).filter(value).limit(2);var refModel=(0,_DBCommon.getReferenceModel)(field,schema);return _rhsCommon.Pipeline.of("getReferenceId").param({}).add(function(){return(0,_DBQuery.find)(refModel,query,args);},function(param,result){var r=result.result;if(r&&r.length&&r.length>1){throw new Error("Multiple values with _id "+r[0]._id+" found in table "+refModel._table);}if(!r||!r.length){throw new Error("No record found for filter "+JSON.stringify(value)+" in table "+refModel._table);}return result;});};var typecastData=function typecastData(_ref5,args){var model=_ref5.model,changeFields=_ref5.changeFields,data=_ref5.data;var schema=model._schema;var relations=getRelations(model);var subQueries=getSubQueries(model);var subModels=getSubModels(schema);var nestedFields=getNestedFields(relations,subModels,subQueries);var subModelObjects=getSubModelObjects(schema);var pipeline=_rhsCommon.Pipeline.of().param({});return typecastChanges(data,changeFields,schema,nestedFields,subModelObjects,void 0,pipeline,args);};var typecastChanges=function typecastChanges(data,changeFields,schema,nestedFields,subModelObjects,mappings,pipeline,args){var references=getReferenceFields(schema,nestedFields);Object.keys(changeFields).forEach(function(k){var value=data[k];var fieldInfo=schema[k];if(!fieldInfo){throw new Error("Schema not found for field >>> "+k+" >> Available fields are >> "+JSON.stringify(Object.keys(schema)));}if(fieldInfo===_rhsCommon.Primitive.number&&!isNumber(value)){throw new Error("Value must be a number for field ["+k+"] but found "+JSON.stringify(value));}else if(fieldInfo===_rhsCommon.Primitive.date){if(!isDate(value)){value=new Date(value);data[k]=value;}}else if(fieldInfo===_rhsCommon.Primitive.boolean&&!isBoolean(value)){throw new Error("Value must be a boolean for field ["+k+"] but found "+JSON.stringify(value));}else if(fieldInfo===_rhsCommon.Primitive.json&&!isJSONObject(value)){try{value=JSON.parse(value);data[k]=value;}catch(error){throw new Error("Value must be a jsonObject for field ["+k+"] but found "+JSON.stringify(value));}}else if(references&&references[k]){if(Array.isArray(value)){var newValue=[];data[k]=newValue;value.forEach(function(v){if(v&&v._id){v={_id:(0,_DBCommon.getObjectId)(v._id)};newValue.push(v);}else{if(isJSONObject(v)){if(!getNullOrObject(v)){throw new Error("Value cannot be empty for field ["+k+"] in "+JSON.stringify(data));}pipeline.add(function(){return getReferenceId(k,schema,v,args);},function(accum,_ref6){var result=_ref6.result;newValue.push(result[0]);});}else{newValue.push(v);}}});}else if(value){var _newValue={};data[k]=_newValue;if(value._id){_newValue["_id"]=(0,_DBCommon.getObjectId)(value._id);}else{if(isJSONObject(value)){if(!getNullOrObject(value)){throw new Error("Value cannot be empty for field ["+k+"] in "+JSON.stringify(data));}pipeline.add(function(){return getReferenceId(k,schema,value,args);},function(param,_ref7){var result=_ref7.result;_newValue["_id"]=result[0]._id;});}else{data[k]=value;}}}else{data[k]=null;}}else if(subModelObjects&&subModelObjects[k]){var nestedModel=getNestedModel(fieldInfo);var nestedSchema=nestedModel._schema;if(value){var changeSubModelObjectFields=changeFields[k].changes;if(!changeSubModelObjectFields&&value&&isJSONObject(value)){changeSubModelObjectFields={};for(var key in value){changeSubModelObjectFields[key]=1;}}typecastChanges(value,changeSubModelObjectFields,nestedSchema,void 0,void 0,void 0,pipeline,args);}}else if(nestedFields&&nestedFields[k]){try{var _nestedModel=getNestedModel(fieldInfo);var _nestedSchema=_nestedModel._schema;var nestedSubModels=getSubModels(_nestedSchema);var childNestedFields=getNestedFields(null,nestedSubModels);if(value){var changes=changeFields[k].changes;if(!changes&&value&&Array.isArray(value)){value&&value.forEach(function(val){var arrayId=val._id;val._id=getValueId(arrayId);var valFields={};for(var valField in val){valFields[valField]=1;}var nestedFieldMappings=mappings?{}:void 0;typecastChanges(val,valFields,_nestedSchema,childNestedFields,void 0,nestedFieldMappings,pipeline,args);populateNestedFieldMappings(mappings,k,val._id,arrayId,nestedFieldMappings);});}else if(changes){changes.forEach(function(change){var _id=change._id,fields=change.fields;var arrayDataValue=getRecordWithId(value,_id);var arrayId=void 0;if(arrayDataValue){arrayId=arrayDataValue._id;var valId=getValueId(arrayId);arrayDataValue._id=valId;change._id=valId;}var nestedFieldMappings=mappings?{}:void 0;typecastChanges(arrayDataValue,fields,_nestedSchema,childNestedFields,void 0,nestedFieldMappings,pipeline,args);populateNestedFieldMappings(mappings,k,arrayDataValue._id,arrayId,nestedFieldMappings);});}}}catch(e){throw new Error(">>>>>Field >>>> ["+k+"] >>> Error >>>> "+e.stack);}}});return pipeline;};var populateNestedFieldMappings=function populateNestedFieldMappings(mappings,field,_id,old_id,innerMappings){if(!mappings){return;}var isNew=typeof old_id==="string"&&old_id.startsWith("new_");if(isNew||Object.keys(innerMappings).length){var nestedFieldMappings=_extends({_id:_id,old_id:old_id},innerMappings);mappings["nestedFields"]=mappings["nestedFields"]||{};mappings["nestedFields"][field]=mappings["nestedFields"][field]||[];mappings["nestedFields"][field].push(nestedFieldMappings);}};var mergeQueryRequiredNestedFields=function mergeQueryRequiredNestedFields(values,queryFields,subModelObjects){if(values){for(var field in values){var value=values[field];if(!subModelObjects||!subModelObjects[field]){queryFields=mergeQueryRequiredFields(value,queryFields,field);}}}return queryFields;};var mergeQueryRequiredFields=function mergeQueryRequiredFields(values,queryFields,nestedField){if(values){for(var field in values){var value=values[field];var _require=value._require,_onChange=value._onChange;var requireFields=getNullOrObject(_require);var changeFields=getNullOrObject(_onChange);if(!requireFields&&!changeFields){throw new Error("Require or onChange must be defined >> "+field+" but found _require >> "+JSON.stringify(requireFields)+" and _onChanges >> "+JSON.stringify(changeFields));}queryFields=mergeRequiredFields(changeFields,queryFields,nestedField);queryFields=mergeRequiredFields(requireFields,queryFields,nestedField);}}return queryFields;};var mergeRequiredFields=function mergeRequiredFields(fields,queryFields,nestedField){if(fields){if(nestedField){var require={};var selfFields=void 0;if(fields["_parent"]){for(var field in fields){if(field!=="_parent"){require[field]=require[field]||{};require[field]=fields[field];}else{selfFields=getNullOrObject(fields["_parent"]);}}queryFields=mergeQueryFields(queryFields,selfFields);queryFields=mergeQueryFields(queryFields,_defineProperty({},nestedField,require));}else{queryFields=mergeQueryFields(queryFields,_defineProperty({},nestedField,fields));}}else{queryFields=mergeQueryFields(queryFields,fields);}}return queryFields;};var insert=function insert(table,value,subModelChanges,options){var _ref8=arguments.length>4&&arguments[4]!==undefined?arguments[4]:{},skipTx=_ref8.skipTx;return function(db){var newValue=convertIncIntoNormal(value);return db.insert(table,newValue,subModelChanges,options,{skipTx:skipTx});};};var findAndModify=function findAndModify(table,query,update,sort,options){return function(db){return db.findAndModify(table,query,update,sort,options);};};var update=function update(table,filter,value,subModelChanges,options){var _ref9=arguments.length>5&&arguments[5]!==undefined?arguments[5]:{},skipTx=_ref9.skipTx;if(!filter){throw new Error("No filter found for update >>>>table>>>"+table);}var filterId=filter._id;if(typeof filterId=="string"&&filterId.indexOf("new_")>=0){throw new Error("_id can not be start with new_ in update it is "+filterId+" >>> table>>>"+table);}return function(db){var newValue=convertIntoSetUnsetAndInc(value);return db.update(table,filter,newValue,subModelChanges,options,{skipTx:skipTx});};};var remove=function remove(table,filter,options){var _ref10=arguments.length>3&&arguments[3]!==undefined?arguments[3]:{},skipTx=_ref10.skipTx;return function(db){return db.remove(table,filter,options,{skipTx:skipTx});};};var save=function save(model,data,args){var user=null;var logger=null;if(args){if(args._id){user=args;}else{if(args.user){user=args.user;}if(args.logger){logger=args.logger;}}}if(typeof model=="function"){model=model();}var modelId=model._id;var insertOp=data.insert,updateOp=data.update,removeOp=data.remove,upsertOp=data.upsert,eventSource=data.eventSource;var endLog=logger&&logger.startLog({op:"dbConnectSave",model:model._id});var table=(0,_DBCommon.getTable)(model);var markUpdatedBy=(0,_DBCommon.getLastUpdatedBy)(model);var schema=getSchema(model);var preMethod=(0,_DBCommon.getPreMethod)(model);var postMethod=(0,_DBCommon.getPostMethod)(model);var transformations=(0,_DBCommon.getTransformations)(model);var computations=getComputations(model._computations,"onSave");var validations=getValidations(model,"onSave");var aggregates=(0,_DBCommon.getAggregates)(model);var relations=getRelations(model);var subModels=getSubModels(schema);var subModelObjects=getSubModelObjects(schema);var nestedFields=getNestedFields(relations,subModels);var references=getReferenceFields(schema,nestedFields);var nestedComputations=getNestedComputations(model._nestedComputations,"onSave");var nestedValidations=getNestedValidations(model,"onSave");var volatiles=(0,_DBCommon.getVolatiles)(model);var triggers=(0,_DBCommon.getTriggers)(model);var getOldDependeciesFields=function getOldDependeciesFields(){return(0,_DBCommon.invoke)("_oldFieldDependencies",{modelId:modelId},args);};var oldDataPipeline=function oldDataPipeline(params){var oldFields=params.oldFields,args=params.args;var saveQuery=getSaveQuery(data,model,nestedFields,aggregates,computations,triggers,validations,oldFields,subModelObjects,nestedComputations,nestedValidations);if(!saveQuery){return{old:null};}else{return _rhsCommon.Pipeline.of("old Data").add(function(){return(0,_DBQuery.find)(model,saveQuery,args);},function(param){var _ref11=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{},result=_ref11.result;return{old:result||null};});}};var preMethodPipeline=function preMethodPipeline(params){if(preMethod){var old=params.old,args=params.args;return _rhsCommon.Pipeline.of("Pre Method Save Called Pipeline").add(function(){return(0,_DBCommon.invoke)(preMethod,{model:modelId,old:old,data:data},args);});}return;};var postMethodPipeline=function postMethodPipeline(params){if(postMethod){var old=params.old,args=params.args;return _rhsCommon.Pipeline.of("Post Method Save Called Pipeline").add(function(){return(0,_DBCommon.invoke)(postMethod,{model:modelId,old:old,data:data},args);});}return;};var triggerEvents=function triggerEvents(_type,args){return function(params){return _rhsCommon.Pipeline.of("triggerEvents").add(function(){return(0,_DBCommon.invoke)("_runDependencies",_extends({modelId:modelId},params,{saveType:_type}),args);},function(){return params;});};};var nativeRelationUpdates=function nativeRelationUpdates(_ref12){var data=_ref12.data,relationChanges=_ref12.relationChanges,old=_ref12.old;if(relationChanges){return _rhsCommon.Pipeline.of("nativeRelationUpdates").add(function(){return getRelationChanges(data,relationChanges,relations,references,schema,old);});}else{return null;}};var getChangesFromChangeFields=function getChangesFromChangeFields(_ref13){var data=_ref13.data,changeFields=_ref13.changeFields,fieldIncs=_ref13.fieldIncs;var actualChanges=getChangesFromMergedData(data,changeFields,fieldIncs,nestedFields,relations,subModelObjects);return actualChanges;};var removeVolatileFields=function removeVolatileFields(_ref14){var selfChanges=_ref14.selfChanges,subModelChanges=_ref14.subModelChanges;if(!volatiles){return;}var newSelfChanges={};var newSubModelChanges={};for(var k in selfChanges){if(!(0,_DBCommon.isVolatileField)(k,volatiles)){newSelfChanges[k]=selfChanges[k];}}for(var _k in subModelChanges){if(!(0,_DBCommon.isVolatileField)(_k,volatiles)){newSubModelChanges[_k]=subModelChanges[_k];}}return{selfChanges:newSelfChanges,subModelChanges:newSubModelChanges};};var maintainUpdateBy=function maintainUpdateBy(_ref15){var selfChanges=_ref15.selfChanges;var newSelfChanges=_extends({},selfChanges)||{};newSelfChanges._updatedOn=new Date();newSelfChanges._updatedBy=user&&{_id:user._id};return newSelfChanges;};var nativeUpdates=function nativeUpdates(_ref16){var _id=_ref16._id,data=_ref16.data,selfChanges=_ref16.selfChanges,subModelChanges=_ref16.subModelChanges,op=_ref16.op,old=_ref16.old;var pipeline=_rhsCommon.Pipeline.of("Native updates");if(op=="insert"){if(selfChanges||subModelChanges){if(markUpdatedBy&&user){selfChanges=maintainUpdateBy({selfChanges:selfChanges});}pipeline.add(function(){return insert(table,selfChanges,subModelChanges);},function(param){return param;});}}else if(op=="update"){if(selfChanges||subModelChanges){if(markUpdatedBy&&user){selfChanges=maintainUpdateBy({selfChanges:selfChanges});}pipeline.add(function(){return update(table,{_id:_id},selfChanges,subModelChanges,{old:old});},function(param){return param;});}}else if(op=="remove"){if(!_id){throw new Error("_id must be defined in remove op");}pipeline.add(function(){return remove(table,{_id:_id},{old:old});},function(param){return param;});}else{throw new Error("Un supported op only insert,update,remove,upsert is supported but found "+JSON.stringify(op));}return pipeline;};var triggerUpdates=function triggerUpdates(args){return function(param){if(triggers){return runTrigger(triggers,param,nestedFields,args);}};};var transformPipeline=function transformPipeline(args){return function(data){if(transformations){return transform(transformations,data,model,nestedFields,args);}else{return data;}};};var aggregatePipeline=function aggregatePipeline(args){return function(param){if(aggregates){return aggregate(aggregates,param,nestedFields,args);}else{return data;}};};var computePipeline=function computePipeline(model){return computeInternally(computations,nestedFields,nestedComputations,_DBQuery.find,null,model,_DBCommon.invoke);};var validatePipeline=function validatePipeline(params){var pipeline=_rhsCommon.Pipeline.of("Db-connect validation error");return pipeline.add(function(){return validateDataPipeline(validations,params,nestedFields,nestedValidations,_DBQuery.find,model,_DBCommon.invoke);},function(_validationParams){var _ref17=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{},validationErrors=_ref17.validationErrors;if(!validationErrors){return;}var error=new Error();error.message=JSON.stringify(validationErrors);throw error;});};var mergeDataAndGetChangeFields=function mergeDataAndGetChangeFields(param){var old=param.old,mappings=param.mappings,args=param.args;var op=null;var changes=null;var upsert=false;var _id=null;mappings=mappings||{};if(insertOp){changes=insertOp;op="insert";_id=insertOp._id;}else if(updateOp){changes=updateOp.changes;_id=updateOp._id;op="update";if(!changes||!Object.keys(changes).length){throw new Error("In update op changes must be defined >>> updateOp >>>> "+JSON.stringify(updateOp));}}else if(upsertOp){var filter=upsertOp.filter,value=upsertOp.value;if(old){_id=old._id;changes=value;op="update";}else{changes=_extends({},value,filter);_id=changes._id;op="insert";upsert=true;}}else if(removeOp){op="remove";_id=removeOp._id;}if(_id){_id=(0,_DBCommon.getObjectId)(_id);}var _mergeOldWithChangesF=mergeOldWithChangesForComputation(old,changes,nestedFields,subModelObjects,schema),data=_mergeOldWithChangesF.data,changeFields=_mergeOldWithChangesF.changeFields,fieldIncs=_mergeOldWithChangesF.fieldIncs;if(op==="insert"){changeFields["_id"]=1;mappings.self=mappings.self||{};mappings.self["old_id"]=_id;if(typeof _id==="string"&&_id.indexOf("new_")>=0||_id===undefined){_id=(0,_DBCommon.getUniqueObjectId)();}mappings.self["_id"]=_id;}if(_id&&data){data._id=_id;}try{var pipeline=_rhsCommon.Pipeline.of("typecast changes").param({});typecastChanges(data,changeFields,schema,nestedFields,subModelObjects,mappings,pipeline,args);pipeline.add(function(){return{data:data,changeFields:changeFields,fieldIncs:fieldIncs,op:op,_id:_id,upsert:upsert,mappings:mappings};});return pipeline;}catch(e){throw new Error("Error in type cast model ["+model._id+"] >>> Error >>>> "+e.stack);}};var typecastChangesPipeline=function typecastChangesPipeline(_ref18){var data=_ref18.data,changeFields=_ref18.changeFields,fieldIncs=_ref18.fieldIncs,mappings=_ref18.mappings,args=_ref18.args;var pipeline=_rhsCommon.Pipeline.of("typecast changes pipeline").param({});typecastChanges(data,changeFields,schema,nestedFields,subModelObjects,mappings,pipeline,args);return pipeline;};return _rhsCommon.Pipeline.of("DbConnect - Save").param({user:user,eventSource:eventSource,args:args}).add(getOldDependeciesFields).add(oldDataPipeline).add(preMethodPipeline).add(mergeDataAndGetChangeFields).add(computePipeline(model)).add(typecastChangesPipeline).add(validatePipeline).add(triggerEvents("preSave",args)).add(getChangesFromChangeFields).add(removeVolatileFields).add(nativeUpdates).add(nativeRelationUpdates).add(triggerEvents("postSave",args)).add(triggerUpdates(args)).add(transformPipeline(args)).add(aggregatePipeline(args)).add(postMethodPipeline).add(function(){return null;},function(param){var result=param.data;var mappings=param.mappings;for(var k in param){delete param[k];}param["result"]=result;param["mappings"]=mappings;endLog&&endLog();return param;});};var dropDB=function dropDB(){return function(db){return db.dropDB();};};var drop=function drop(model){if(typeof model=="function"){model=model();}var table=(0,_DBCommon.getTable)(model);return function(db){return db.dropTable(table);};};var getIndexes=function getIndexes(table){return function(db){return db.getIndexes(table);};};var dropIndex=function dropIndex(table,indexname){return function(db){return db.dropIndex(table,indexname);};};var createIndex=function createIndex(table,index,options){return function(db){return db.createIndex(table,index,options);};};var commit=function commit(){return function(db){return db.commit();};};var rollback=function rollback(dbConnect){return function(db){return db.rollback(dbConnect);};};module.exports={commit:commit,rollback:rollback,insert:insert,findAndModify:findAndModify,update:update,remove:remove,save:save,dropDB:dropDB,drop:drop,getIndexes:getIndexes,dropIndex:dropIndex,createIndex:createIndex,typecastData:typecastData};