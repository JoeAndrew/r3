import MyBuilderCaption               from './builderCaption.js';
import {MyBuilderFunctionPlaceholder} from './builderFunctions.js';
import {getDataFieldMap}              from '../shared/form.js';
import {
	getDependentModules,
	getItemTitle
} from '../shared/builder.js';
export {MyBuilderJsFunction as default};

let MyBuilderJsFunction = {
	name:'my-builder-js-function',
	components:{
		MyBuilderCaption,
		MyBuilderFunctionPlaceholder
	},
	template:`<div class="builder-function">
		
		<div class="contentBox" v-if="jsFunction">
			<div class="top">
				<div class="area nowrap">
					<my-builder-caption
						v-model="captions.jsFunctionTitle"
						:contentName="capApp.titleOne"
						:language="builderLanguage"
					/>
				</div>
				<div class="area">
					<my-button
						@trigger="showSidebar = !showSidebar"
						:darkBg="true"
						:image="showSidebar ? 'toggleRight.png' : 'toggleLeft.png'"
					/>
				</div>
			</div>
			<div class="top lower">
				<div class="area nowrap">
					<my-button image="save.png"
						@trigger="set"
						:active="hasChanges"
						:caption="capGen.button.save"
						:darkBg="true"
					/>
					<my-button image="refresh.png"
						@trigger="reset"
						:active="hasChanges"
						:caption="capGen.button.refresh"
						:darkBg="true"
					/>
					<my-button
						@trigger="showDetails = !showDetails"
						:caption="capApp.button.details"
						:darkBg="true"
						:image="showDetails ? 'visible1.png' : 'visible0.png'"
					/>
					<my-button
						@trigger="showPreview = !showPreview"
						:caption="capApp.preview"
						:darkBg="true"
						:image="showPreview ? 'visible1.png' : 'visible0.png'"
					/>
				</div>
			</div>
			
			<div class="content no-padding function-details default-inputs">
				<table v-if="showDetails">
					<tr>
						<td>{{ capApp.codeArgs }}</td>
						<td><input v-model="codeArgs" /></td>
					</tr>
					<tr>
						<td>{{ capApp.codeReturns }}</td>
						<td><input v-model="codeReturns" /></td>
					</tr>
					<tr>
						<td>{{ capGen.title }}</td>
						<td>
							<my-builder-caption
								v-model="captions.jsFunctionTitle"
								:language="builderLanguage"
							/>
						</td>
					</tr>
					<tr>
						<td>{{ capGen.description }}</td>
						<td>
							<my-builder-caption
								v-model="captions.jsFunctionDesc"
								:language="builderLanguage"
								:multiLine="true"
							/>
						</td>
					</tr>
				</table>
				
				<!-- function body input -->
				<textarea class="input"
					v-if="!showPreview"
					v-model="codeFunction"
					@click="insertEntitySelected"
					@keydown.tab.prevent="addTab"
					:placeholder="capApp.code"
				></textarea>
				
				<!-- function body preview -->
				<textarea class="input" disabled="disabled"
					v-if="showPreview"
					v-model="preview"
				></textarea>
			</div>
		</div>
		
		<div class="contentBox right" v-if="jsFunction && showSidebar">
			<div class="top">
				<div class="area nowrap">
					<img class="icon" src="images/database.png" />
					<h1 class="title">{{ capApp.placeholders }}</h1>
				</div>
			</div>
			<div class="top lower">
				<div class="area nowrap">
				</div>
			</div>
			<div class="content padding default-inputs">
				
				<div class="message" v-html="capApp.entityInput"></div>
				
				<template v-if="formId !== null">
					<div class="placeholders fields-title">
						<h2>{{ capApp.placeholdersForm }}</h2>
						
						<select v-model="fieldMode">
							<option value="get">{{ capApp.option.fieldGet }}</option>
							<option value="set">{{ capApp.option.fieldSet }}</option>
						</select>
					</div>
					
					<div class="placeholders fields">
						<my-builder-function-placeholder
							v-for="f in dataFieldMap"
							@toggle="toggleEntity('field',f.id)"
							:builderLanguage="builderLanguage"
							:key="f.id"
							:name="displayFieldName(f)"
							:selected="entitySelected === 'field' && entitySelectedId === f.id"
						/>
					</div>
				</template>
				
				<h2>{{ capApp.placeholdersModules }}</h2>
				<div class="placeholders modules"
					v-for="mod in getDependentModules(module,modules).filter(v => v.pgFunctions.length !== 0 || v.jsFunctions.length !== 0)"
					:key="mod.id"
				>
					<my-button
						@trigger="toggleModule(mod.id)"
						:caption="mod.name"
						:image="moduleIdsOpen.includes(mod.id) ? 'triangleDown.png' : 'triangleRight.png'"
						:naked="true"
					/>
					
					<template v-if="moduleIdsOpen.includes(mod.id)">
						
						<!-- JS functions -->
						<div class="functions-title" v-if="mod.jsFunctions.filter(v => v.formId === null || v.formId === formId).length !== 0">
							{{ capApp.functionsFrontend }}
						</div>
						<div class="placeholders functions">
							<my-builder-function-placeholder
								v-for="f in mod.jsFunctions.filter(v => v.formId === null || v.formId === formId)"
								@show-help="showHelp(f.name+'()',$event)"
								@toggle="toggleEntity('jsFunction',f.id)"
								:builderLanguage="builderLanguage"
								:functionObj="f"
								:functionType="'js'"
								:key="f.id"
								:name="f.name"
								:selected="entitySelected === 'jsFunction' && entitySelectedId === f.id"
							/>
						</div>
						
						<!-- PG functions -->
						<div class="functions-title" v-if="mod.pgFunctions.filter(v => v.codeReturns !== 'trigger' && v.codeReturns !== 'TRIGGER').length !== 0">
							{{ capApp.functionsBackend }}
						</div>
						<div class="placeholders functions">
							<my-builder-function-placeholder
								v-for="f in mod.pgFunctions.filter(v => v.codeReturns !== 'trigger' && v.codeReturns !== 'TRIGGER')"
								@show-help="showHelp(f.name+'()',$event)"
								@toggle="toggleEntity('pgFunction',f.id)"
								:builderLanguage="builderLanguage"
								:functionObj="f"
								:functionType="'pg'"
								:key="f.id"
								:name="f.name"
								:selected="entitySelected === 'pgFunction' && entitySelectedId === f.id"
							/>
						</div>
					</template>
				</div>
				
				<h2>{{ capApp.placeholdersGlobal }}</h2>
				
				<div class="placeholders functions">
					<my-builder-function-placeholder
						v-for="f in appFunctions"
						@show-help="showHelp(f+'()',$event)"
						@toggle="toggleEntity('appFunction',f)"
						:builderLanguage="builderLanguage"
						:functionHelp="capApp.helpJs[f]"
						:key="f"
						:name="f"
						:selected="entitySelected === 'appFunction' && entitySelectedId === f"
					/>
				</div>
			</div>
		</div>
	</div>`,
	props:{
		builderLanguage:{ type:String, required:true },
		id:             { type:String, required:true }
	},
	watch:{
		jsFunction:{
			handler:function() { this.reset(); },
			immediate:true
		}
	},
	data:function() {
		return {
			name:'',
			formId:null,
			captions:{},
			codeArgs:'',
			codeFunction:'',
			codeReturns:'',
			
			appFunctions:[
				'get_language_code','get_login_id','get_record_id',
				'get_role_ids','go_back','has_role','open_form',
				'record_delete','record_reload','record_save'
			],
			
			// states
			fieldMode:'get',
			entitySelected:'',
			entitySelectedId:null,
			moduleIdsOpen:[],
			showDetails:false,
			showPreview:false,
			showSidebar:true
		};
	},
	computed:{
		dataFieldMap:function() {
			if(this.formId === null)
				return {};
			
			return this.getDataFieldMap(this.formIdMap[this.formId].fields);
		},
		module:function() {
			if(this.jsFunction === false)
				return false;
			
			return this.moduleIdMap[this.jsFunction.moduleId];
		},
		jsFunction:function() {
			if(typeof this.jsFunctionIdMap[this.id] === 'undefined')
				return false;
			
			return this.jsFunctionIdMap[this.id];
		},
		hasChanges:function() {
			return this.codeArgs     !== this.jsFunction.codeArgs
				|| this.codeFunction !== this.placeholdersSet(this.jsFunction.codeFunction)
				|| this.codeReturns  !== this.jsFunction.codeReturns
				|| JSON.stringify(this.captions) !== JSON.stringify(this.jsFunction.captions);
		},
		preview:function() {
			if(!this.showPreview) return '';
			
			return this.placeholdersUnset();
		},
		
		// stores
		modules:        function() { return this.$store.getters['schema/modules']; },
		moduleIdMap:    function() { return this.$store.getters['schema/moduleIdMap']; },
		moduleNameMap:  function() { return this.$store.getters['schema/moduleNameMap']; },
		relationIdMap:  function() { return this.$store.getters['schema/relationIdMap']; },
		attributeIdMap: function() { return this.$store.getters['schema/attributeIdMap']; },
		formIdMap:      function() { return this.$store.getters['schema/formIdMap']; },
		jsFunctionIdMap:function() { return this.$store.getters['schema/jsFunctionIdMap']; },
		pgFunctionIdMap:function() { return this.$store.getters['schema/pgFunctionIdMap']; },
		capApp:         function() { return this.$store.getters.captions.builder.function; },
		capGen:         function() { return this.$store.getters.captions.generic; }
	},
	methods:{
		// externals
		getDataFieldMap,
		getDependentModules,
		getItemTitle,
		
		// presentation
		displayFieldName:function(f) {
			let atr = this.attributeIdMap[f.attributeId];
			let rel = this.relationIdMap[atr.relationId];
			return this.getItemTitle(rel,atr,f.index,false,false);
		},
		
		// actions
		addTab:function(evt) {
			let field    = evt.target;
			let startPos = field.selectionStart;
			let endPos   = field.selectionEnd;
			
			field.value = field.value.substring(0, startPos)
				+ "\t"+ field.value.substring(endPos);
			
			field.selectionStart = startPos + 1;
			field.selectionEnd   = startPos + 1;
		},
		reset:function() {
			this.name         = this.jsFunction.name;
			this.formId       = this.jsFunction.formId;
			this.codeArgs     = this.jsFunction.codeArgs;
			this.codeFunction = this.placeholdersSet(this.jsFunction.codeFunction);
			this.codeReturns  = this.jsFunction.codeReturns;
			this.captions     = JSON.parse(JSON.stringify(this.jsFunction.captions));
		},
		insertEntitySelected:function(evt) {
			if(this.entitySelectedId === null)
				return;
			
			let field  = evt.target;
			let text   = '';
			let prefix = 'app';
			let mod, rel, atr, fnc, frm, fld;
			
			// build unique placeholder name
			switch(this.entitySelected) {
				case 'appFunction':
					text = `${prefix}.${this.entitySelectedId}()`;
				break;
				case 'form':
					frm  = this.formIdMap[this.entitySelectedId];
					mod  = this.moduleIdMap[frm.moduleId];
					text = `${prefix}.open_form({${mod.name}.${frm.name}},0,false)`;
				break;
				case 'field':
					fld  = this.dataFieldMap[this.entitySelectedId];
					atr  = this.attributeIdMap[fld.attributeId];
					rel  = this.relationIdMap[atr.relationId];
					let opt = this.fieldMode === 'get' ? '' : this.capApp.valueNewJsHint;
					text = `${prefix}.${this.fieldMode}_field_value({${fld.index}:${rel.name}.${atr.name}}${opt})`;
				break;
				case 'jsFunction':
					fnc  = this.jsFunctionIdMap[this.entitySelectedId];
					mod  = this.moduleIdMap[fnc.moduleId];
					text = `${prefix}.call_frontend({${mod.name}.${fnc.name}})`;
				break;
				case 'pgFunction':
					fnc  = this.pgFunctionIdMap[this.entitySelectedId];
					mod  = this.moduleIdMap[fnc.moduleId];
					text = `${prefix}.call_backend({${mod.name}.${fnc.name}})`;
				break;
			}
			
			if(field.selectionStart || field.selectionStart === '0') {
				
				let startPos = field.selectionStart;
				let endPos   = field.selectionEnd;
				
				field.value = field.value.substring(0,startPos)
					+ text
					+ field.value.substring(endPos, field.value.length);
				
				field.selectionStart = startPos + text.length;
				field.selectionEnd   = startPos + text.length;
			}
			else {
				field.value += text;
			}
			this.codeFunction = field.value;
			this.entitySelectedId = null;
		},
		toggleEntity:function(entityName,id) {
			if(this.entitySelected === entityName && this.entitySelectedId === id) {
				this.entitySelected   = '';
				this.entitySelectedId = null;
				return;
			}
			this.entitySelected   = entityName;
			this.entitySelectedId = id;
		},
		toggleModule:function(id) {
			let pos = this.moduleIdsOpen.indexOf(id);
			
			if(pos === -1)
				return this.moduleIdsOpen.push(id);
			
			this.moduleIdsOpen.splice(pos,1);
		},
		showHelp:function(top,text) {
			this.$store.commit('dialog',{
				captionTop:top,
				captionBody:text,
				buttons:[{
					caption:this.capGen.button.close,
					cancel:true,
					image:'cancel.png'
				}]
			});
		},
		
		// placeholders are used for storing entities via ID instead of name (which can change)
		placeholdersSet:function(body) {
			let that   = this;
			let fields = this.dataFieldMap;
			let uuid   = '[a-z0-9\-]{36}';
			let prefix = 'app';
			let pat;
			
			// replace field IDs with placeholders
			pat = new RegExp(`${prefix}\.(get|set)_field_value\\(\'(${uuid})'`,'g');
			body = body.replace(pat,function(match,fldMode,id) {
				let fld = false;
				
				for(let k in fields) {
					if(fields[k].id === id) {
						fld = fields[k];
						break;
					}
				}
				if(fld === false)
					return match;
				
				let atr = that.attributeIdMap[fld.attributeId];
				let rel = that.relationIdMap[atr.relationId];
				return `${prefix}.${fldMode}_field_value({${fld.index}:${rel.name}.${atr.name}}`;
			});
			
			// replace function IDs with placeholders
			pat = new RegExp(`${prefix}\.call_(backend|frontend)\\(\'(${uuid})'`,'g');
			body = body.replace(pat,function(match,fncMode,id) {
				let fnc = false;
				
				if(fncMode === 'backend' && that.pgFunctionIdMap[id] !== 'undefined') {
					fnc = that.pgFunctionIdMap[id];
				}
				else if(fncMode === 'frontend' && that.jsFunctionIdMap[id] !== 'undefined') {
					fnc = that.jsFunctionIdMap[id];
				}
				if(fnc === false)
					return match;
				
				let mod = that.moduleIdMap[fnc.moduleId];
				return `${prefix}.call_${fncMode}({${mod.name}.${fnc.name}}`;
			});
			
			return body;
		},
		placeholdersUnset:function() {
			let that   = this;
			let body   = this.codeFunction;
			let fields = this.dataFieldMap;
			let prefix = 'app';
			let dbName = '[a-z0-9_]+';
			let pat;
			
			// replace field get/set placeholders
			// stored as: app.get_field_value({0:contact.is_active}...
			pat = new RegExp(`${prefix}\.(get|set)_field_value\\(\{(\\d+)\:(${dbName})\.(${dbName})\}`,'g');
			body = body.replace(pat,function(match,fldMode,index,relName,atrName) {
				
				// resolve relation by name
				let rel = false;
				
				for(let i = 0, j = that.module.relations.length; i < j; i++) {
					if(that.module.relations[i].name !== relName)
						continue;
					
					rel = that.module.relations[i];
					break;
				}
				if(rel === false)
					return match;
				
				// resolve attribute by name
				let atr = false;
				
				for(let i = 0, j = rel.attributes.length; i < j; i++) {
					if(rel.attributes[i].name !== atrName)
						continue;
					
					atr = rel.attributes[i];
					break;
				}
				if(atr === false)
					return match;
				
				// data field
				let fld = false;
				
				for(let k in fields) {
					if(fields[k].index === parseInt(index) && fields[k].attributeId === atr.id) {
						fld = fields[k];
						break;
					}
				}
				if(fld === false)
					return match;
				
				// replace placeholder
				return `${prefix}\.${fldMode}_field_value('${fld.id}'`;
			});
			
			// replace frontend/backend function placeholders
			// stored as: app.call_backend({r3_organizations.get_name_by_id},12...
			pat = new RegExp(`${prefix}\.call_(frontend|backend)\\(\{(${dbName})\.(${dbName})\}`,'g');
			body = body.replace(pat,function(match,fncMode,modName,fncName) {
				
				// resolve module by name
				if(typeof that.moduleNameMap[modName] === 'undefined')
					return match;
				
				let mod = that.moduleNameMap[modName];
				
				// resolve function by name
				let fnc = false;
				
				if(fncMode === 'backend') {
					for(let i = 0, j = mod.pgFunctions.length; i < j; i++) {
						if(mod.pgFunctions[i].name !== fncName)
							continue;
						
						fnc = mod.pgFunctions[i];
						break;
					}
				}
				else if(fncMode === 'frontend') {
					for(let i = 0, j = mod.jsFunctions.length; i < j; i++) {
						if(mod.jsFunctions[i].name !== fncName)
							continue;
						
						fnc = mod.jsFunctions[i];
						break;
					}
				}
				
				if(fnc === false)
					return match;
				
				// replace placeholder
				return `${prefix}\.call_${fncMode}('${fnc.id}'`;
			});
			
			return body;
		},
		
		// backend calls
		set:function() {
			let trans = new wsHub.transactionBlocking();
			
			trans.add('jsFunction','set',{
				id:this.jsFunction.id,
				moduleId:this.jsFunction.moduleId,
				formId:this.jsFunction.formId,
				name:this.jsFunction.name,
				codeArgs:this.codeArgs,
				codeFunction:this.placeholdersUnset(),
				codeReturns:this.codeReturns,
				captions:this.captions
			},this.setOk);
			trans.add('schema','check',{moduleId:this.module.id});
			trans.send(this.$root.genericError);
		},
		setOk:function(res) {
			this.$root.schemaReload(this.module.id);
		}
	}
};