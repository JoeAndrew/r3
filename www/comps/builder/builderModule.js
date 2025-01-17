import MyBuilderCaption      from './builderCaption.js';
import MyBuilderIconInput    from './builderIconInput.js';
import srcBase64Icon         from '../shared/image.js';
import {getDependentModules} from '../shared/builder.js';
import {getUnixFormat}       from '../shared/time.js';
import {MyModuleSelect}      from '../input.js';
import {
	copyValueDialog,
	getNilUuid
} from '../shared/generic.js';
export {MyBuilderModule as default};

let MyBuilderModuleStartForm = {
	name:'my-builder-module-start-form',
	template:`<div class="item shade">
		<img v-if="!readonly" class="dragAnchor" src="images/drag.png" />
		<select v-model="roleId" :disabled="readonly">
			<option :value="null"><i>[{{ capGen.role }}]</i></option>
			<option v-for="r in module.roles" :value="r.id">
				{{ r.name }}
			</option>
		</select>
		<select v-model="formId" :disabled="readonly">
			<option :value="null"><i>[{{ capApp.startFormDefault }}]</i></option>
			<option v-for="f in module.forms" :value="f.id">
				{{ f.name }}
			</option>
		</select>
		<my-button image="delete.png"
			@trigger="$emit('remove')"
			:active="!readonly"
			:cancel="true"
		/>
	</div>`,
	props:{
		modelValue:{ type:Object,  required:true },
		module:    { type:Object,  required:true },
		readonly:  { type:Boolean, required:true }
	},
	emits:['remove','update:modelValue'],
	computed:{
		// inputs
		formId:{
			get()  { return this.modelValue.formId; },
			set(v) { this.update('formId',v); }
		},
		roleId:{
			get()  { return this.modelValue.roleId; },
			set(v) { this.update('roleId',v); }
		},
		
		// stores
		capApp:(s) => s.$store.getters.captions.builder.module,
		capGen:(s) => s.$store.getters.captions.generic
	},
	methods:{
		update(name,value) {
			let v = JSON.parse(JSON.stringify(this.modelValue));
			v[name] = value;
			
			this.$emit('update:modelValue',v);
		}
	}
};

let MyBuilderModule = {
	name:'my-builder-module',
	components:{
		'chrome-picker':VueColor.Chrome,
		MyBuilderCaption,
		MyBuilderIconInput,
		MyBuilderModuleStartForm,
		MyModuleSelect
	},
	template:`<div class="builder-module contentBox grow" v-if="module">
		<div class="top">
			<div class="area nowrap">
				<img class="icon" src="images/module.png" />
				<h1 class="title">{{ capApp.title.replace('{NAME}',this.name) }}</h1>
			</div>
		</div>
		<div class="top lower">
			<div class="area nowrap">
				<my-button image="save.png"
					@trigger="set"
					:active="hasChanges && !readonly"
					:caption="capGen.button.save"
				/>
				<my-button image="refresh.png"
					@trigger="reset"
					:active="hasChanges"
					:caption="capGen.button.refresh"
				/>
				<my-button image="visible1.png"
					@trigger="copyValueDialog(module.name,module.id,module.id)"
					:caption="capGen.id"
				/>
			</div>
		</div>
		
		<div class="content default-inputs">
			<table class="generic-table-vertical">
				<tr>
					<td>{{ capGen.name }}</td>
					<td><input v-model="name" :disabled="readonly" :placeholder="capApp.nameHolder" /></td>
					<td>{{ capApp.nameHint }}</td>
				</tr>
				<tr>
					<td>{{ capGen.title }}</td>
					<td>
						<my-builder-caption class="title"
							v-model="captions.moduleTitle"
							:contentName="capGen.title"
							:language="builderLanguage"
							:readonly="readonly"
						/>
					</td>
					<td>{{ capApp.titleHint }}</td>
				</tr>
				<tr>
					<td>{{ capApp.dependsOn }}</td>
					<td>
						<div class="item-list">
							<my-button image="delete.png"
								v-for="m in modules.filter(v => v.id !== module.id && dependsOn.includes(v.id))"
								@trigger="toggleDependsOn(m.id,false)"
								:active="!readonly"
								:caption="m.name"
								:naked="true"
							/>
						</div>
						<my-module-select
							v-if="!readonly"
							@update:modelValue="toggleDependsOn($event,true)"
							:moduleIdsFilter="dependsOn.concat([id])"
							:modelValue="moduleIdDependsOnInput"
							:preSelectOne="false"
						/>
					</td>
					<td>{{ capApp.dependsOnHint }}</td>
				</tr>
				<tr>
					<td>{{ capGen.icon }}</td>
					<td>
						<my-builder-icon-input
							@input="iconId = $event"
							:icon-id-selected="iconId"
							:module="module"
							:readonly="readonly"
						/>
					</td>
					<td>{{ capApp.iconHint }}</td>
				</tr>
				<tr>
					<td>{{ capApp.color }}</td>
					<td>
						<div class="row gap">
							<input class="short"
								v-model="color1"
								:disabled="readonly"
							/>
							<div v-click-outside="hideColorPicker">
								<div class="builder-color shade"
									@click="showColorPicker = !showColorPicker"
									:class="{ clickable:!readonly }"
									:style="styleColorPreview"
								></div>
								
								<div class="colorPickerWrap" v-if="!readonly">
									<chrome-picker class="colorPickerFloating"
										v-if="showColorPicker"
										@update:modelValue="setColor"
										:disable-alpha="true"
										:disable-fields="true"
										:modelValue="color1"
									/>
								</div>
							</div>
						</div>
					</td>
					<td>{{ capApp.colorHint }}</td>
				</tr>
				<tr>
					<td>{{ capApp.parent }}</td>
					<td>
						<select v-model="parentId" :disabled="readonly">
							<option :value="null">-</option>
							<option
								v-for="mod in getDependentModules(module,modules).filter(v => v.id !== module.id && v.parentId === null)"
								:value="mod.id"
							>
								{{ mod.name }}
							</option>
						</select>
					</td>
					<td>{{ capApp.parentHint }}</td>
				</tr>
				<tr>
					<td>{{ capApp.position }}</td>
					<td><input class="short" v-model.number="position" :disabled="readonly" /></td>
					<td>{{ capApp.positionHint }}</td>
				</tr>
				<tr>
					<td>{{ capApp.startFormDefault }}</td>
					<td>
						<select v-model="formId" :disabled="readonly">
							<option :value="null">-</option>
							<option v-for="f in module.forms" :value="f.id">
								{{ f.name }}
							</option>
						</select>
					</td>
					<td>{{ capApp.startFormDefaultHint }}</td>
				</tr>
				<tr>
					<td>{{ capApp.startFormByRole }}</td>
					<td>
						<div class="item-list">
							<draggable handle=".dragAnchor" group="start-forms" itemKey="id" animation="100"
								:fallbackOnBody="true"
								:list="startForms"
							>
								<template #item="{element,index}">
									<my-builder-module-start-form
										@remove="startForms.splice(index,1)"
										@update:modelValue="startForms[index] = $event"
										:modelValue="element"
										:module="module"
										:readonly="readonly"
									/>
								</template>
							</draggable>
						</div>
							
						<my-button image="add.png"
							@trigger="addStartForm"
							:active="!readonly"
							:caption="capGen.button.add"
						/>
					</td>
					<td>{{ capApp.startFormByRoleHint }}</td>
				</tr>
				<tr>
					<td>{{ capApp.languages }}</td>
					<td>
						<!-- language entry and header title -->
						<div class="item-list">
							<div class="item shade" v-for="(l,i) in languages">
								<input type="text"
									v-model="languages[i]"
									:disabled="readonly"
									:placeholder="capApp.languageCodeHint"
								/>
								<my-button image="delete.png"
									@trigger="languages.splice(i,1)"
									:active="!readonly"
									:cancel="true"
								/>
							</div>
						</div>
						
						<my-button image="add.png"
							@trigger="languages.push('')"
							:active="!readonly"
							:caption="capGen.button.add"
						/>
					</td>
					<td>{{ capApp.languagesHint }}</td>
				</tr>
				<tr>
					<td>{{ capApp.languageMain }}</td>
					<td>
						<select v-model="languageMain" :disabled="readonly">
							<option
								v-for="l in languages"
								:value="l"
							>{{ l }}</option>
						</select>
					</td>
					<td>{{ capApp.languageMainHint }}</td>
				</tr>
				
				<tr>
					<td colspan="2"><b>{{ capApp.pwa }}</b></td>
					<td>{{ capApp.pwaHint }}</td>
				</tr>
				<tr>
					<td>{{ capApp.namePwa }}</td>
					<td><input v-model="namePwa" :disabled="readonly" /></td>
					<td>{{ capApp.namePwaHint }}</td>
				</tr>
				<tr>
					<td>{{ capApp.namePwaShort }}</td>
					<td><input v-model="namePwaShort" :disabled="readonly" /></td>
					<td>{{ capApp.namePwaShortHint }}</td>
				</tr>
				<tr>
					<td>{{ capApp.iconPwa }}</td>
					<td>
						<div class="row gap centered">
							<span>192x192 px</span>
							<my-builder-icon-input
								@input="iconIdPwa1 = $event"
								:icon-id-selected="iconIdPwa1"
								:module="module"
								:readonly="readonly"
							/>
							<span></span>
							<span>512x512 px</span>
							<my-builder-icon-input
								@input="iconIdPwa2 = $event"
								:icon-id-selected="iconIdPwa2"
								:module="module"
								:readonly="readonly"
							/>
						</div>
					</td>
					<td>{{ capApp.iconPwaHint }}</td>
				</tr>
				
				<tr><td colspan="3"><b>{{ capApp.release }}</b></td></tr>
				<tr>
					<td>{{ capApp.releaseDate }}</td>
					<td colspan="2"><input :value="displayReleaseDate" disabled="disabled" /></td>
				</tr>
				<tr>
					<td>{{ capApp.releaseBuild }}</td>
					<td colspan="2"><input class="short" v-model="releaseBuild" disabled="disabled" /></td>
				</tr>
				<tr>
					<td>{{ capApp.releaseBuildApp }}</td>
					<td colspan="2"><input class="short" v-model="releaseBuildApp" disabled="disabled" /></td>
				</tr>
			</table>
		</div>
	</div>`,
	emits:['hotkeysRegister'],
	props:{
		builderLanguage:{ type:String,  required:true },
		id:             { type:String,  required:true },
		readonly:       { type:Boolean, required:true }
	},
	mounted() {
		this.$emit('hotkeysRegister',[{fnc:this.set,key:'s',keyCtrl:true}]);
	},
	unmounted() {
		this.$emit('hotkeysRegister',[]);
	},
	data() {
		return {
			// inputs
			parentId:null,
			formId:null,
			iconId:null,
			iconIdPwa1:null,
			iconIdPwa2:null,
			name:'',
			namePwa:null,
			namePwaShort:null,
			color1:'217A4D',
			position:0,
			releaseBuild:0,
			releaseBuildApp:0,
			releaseDate:0,
			languageMain:'en_us',
			languages:['en_us'],
			dependsOn:[],
			startForms:[],
			articleIdsHelp:[],
			captions:{
				moduleTitle:{}
			},
			
			// states
			moduleIdDependsOnInput:null,
			showColorPicker:false,
			showDependencies:false,
			showLanguages:false,
			showStartForms:false
		};
	},
	computed:{
		hasChanges:(s) =>
			s.parentId        !== s.module.parentId
			|| s.formId       !== s.module.formId
			|| s.iconId       !== s.module.iconId
			|| s.iconIdPwa1   !== s.module.iconIdPwa1
			|| s.iconIdPwa2   !== s.module.iconIdPwa2
			|| s.name         !== s.module.name
			|| s.namePwa      !== s.module.namePwa
			|| s.namePwaShort !== s.module.namePwaShort
			|| s.color1       !== s.module.color1
			|| s.position     !== s.module.position
			|| s.languageMain !== s.module.languageMain
			|| JSON.stringify(s.dependsOn)  !== JSON.stringify(s.module.dependsOn)
			|| JSON.stringify(s.startForms) !== JSON.stringify(s.module.startForms)
			|| JSON.stringify(s.languages)  !== JSON.stringify(s.module.languages)
			|| JSON.stringify(s.captions)   !== JSON.stringify(s.module.captions),
		
		// simple
		displayReleaseDate:(s) => s.releaseDate === 0 ? '-' : s.getUnixFormat(s.releaseDate,'Y-m-d H:i'),
		module:            (s) => typeof s.moduleIdMap[s.id] === 'undefined' ? false : s.moduleIdMap[s.id],
		styleColorPreview: (s) => `background-color:#${s.color1};`,
		
		// stores
		modules:           (s) => s.$store.getters['schema/modules'],
		moduleIdMap:       (s) => s.$store.getters['schema/moduleIdMap'],
		relationIdMap:     (s) => s.$store.getters['schema/relationIdMap'],
		attributeIdMap:    (s) => s.$store.getters['schema/attributeIdMap'],
		capApp:            (s) => s.$store.getters.captions.builder.module,
		capGen:            (s) => s.$store.getters.captions.generic
	},
	watch:{
		module:{
			handler() { this.reset(); },
			immediate:true
		}
	},
	methods:{
		// externals
		copyValueDialog,
		getDependentModules,
		getNilUuid,
		getUnixFormat,
		srcBase64Icon,
		
		reset() {
			if(!this.module) return;
			
			// values
			this.parentId        = this.module.parentId;
			this.formId          = this.module.formId;
			this.iconId          = this.module.iconId;
			this.iconIdPwa1      = this.module.iconIdPwa1;
			this.iconIdPwa2      = this.module.iconIdPwa2;
			this.name            = this.module.name;
			this.namePwa         = this.module.namePwa;
			this.namePwaShort    = this.module.namePwaShort;
			this.color1          = this.module.color1;
			this.position        = this.module.position;
			this.languageMain    = this.module.languageMain;
			this.releaseBuild    = this.module.releaseBuild;
			this.releaseBuildApp = this.module.releaseBuildApp;
			this.releaseDate     = this.module.releaseDate;
			this.dependsOn       = JSON.parse(JSON.stringify(this.module.dependsOn));
			this.startForms      = JSON.parse(JSON.stringify(this.module.startForms));
			this.languages       = JSON.parse(JSON.stringify(this.module.languages));
			this.captions        = JSON.parse(JSON.stringify(this.module.captions));
			
			// states
			this.showColorPicker  = false;
		},
		
		// actions
		addStartForm() {
			this.startForms.push({
				position:this.startForms.length,
				formId:null,
				roleId:null
			});
		},
		goBack() {
			window.history.back();
		},
		hideColorPicker() {
			this.showColorPicker = false;
		},
		setColor(newVal) {
			this.color1 = newVal.hex.substr(1);
		},
		toggleDependsOn(moduleId,state) {
			let pos = this.dependsOn.indexOf(moduleId);
			
			if(pos === -1 && state)
				this.dependsOn.push(moduleId);
			else if(pos !== -1 && !state)
				this.dependsOn.splice(pos,1);
		},
		
		// backend calls
		set() {
			this.languages.sort(); // for change comparissons
			
			let requests = [
				ws.prepare('module','set',{
					id:this.id,
					parentId:this.parentId,
					formId:this.formId,
					iconId:this.iconId,
					iconIdPwa1:this.iconIdPwa1,
					iconIdPwa2:this.iconIdPwa2,
					name:this.name,
					namePwa:this.namePwa !== '' ? this.namePwa : null,
					namePwaShort:this.namePwaShort !== '' ? this.namePwaShort : null,
					color1:this.color1,
					position:this.position,
					languageMain:this.languageMain,
					releaseBuild:this.releaseBuild,
					releaseBuildApp:this.releaseBuildApp,
					releaseDate:this.releaseDate,
					dependsOn:this.dependsOn,
					startForms:this.startForms,
					languages:this.languages,
					articleIdsHelp:this.module.articleIdsHelp,
					captions:this.captions
				}),
				ws.prepare('schema','check',{moduleId:this.id})
			];
			
			ws.sendMultiple(requests,true).then(
				() => {
					// reload entire schema if parent has changed
					if(this.parentId !== this.module.parentId)
						this.$root.schemaReload();
					else
						this.$root.schemaReload(this.id);
				},
				this.$root.genericError
			);
		}
	}
};
