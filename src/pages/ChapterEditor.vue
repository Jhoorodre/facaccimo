<template>
  <div>
    <b-modal
      v-model="isImporting"
      has-modal-card
      :destroy-on-hide="false"
      aria-role="dialog"
      :aria-label="$t('chapterEditor.import')"
      aria-modal>
      <template #default="props">
        <div class="modal-card" style="width: auto">
          <header class="modal-card-head">
            <p class="modal-card-title">{{ $t('chapterEditor.importTitle') }}</p>
          </header>
          <section class="modal-card-body">
            <b-field :label="$t('chapterEditor.importLabel')">
              <b-input v-model="importContent" :placeholder="$t('chapterEditor.importPlaceholder')" type="textarea"></b-input>
            </b-field>
          </section>
          <footer class="modal-card-foot is-justify-content-flex-end">
            <b-button @click="props.close">{{ $t('common.discard') }}</b-button>
            <b-button type="is-primary" @click="finishImport(props.close)">{{ $t('chapterEditor.importConfirm') }}</b-button>
          </footer>
        </div>
      </template>
    </b-modal>
    <div>
      <div class="column">
        <div class="card">
          <header class="card-header">
            <p class="card-header-title">
              {{ $t('chapterManager.chapterNumber') }} {{ chapterKey }}
            </p>
            <div class="buttons">
              <b-button type="is-danger" @click="discard">{{ $t('common.discard') }}</b-button>
              <b-button type="is-success" @click="save">{{ $t('common.save') }}</b-button>
            </div>
          </header>
          <div class="card-content">
            <div class="content">
              <section>
                <b-field :label="$t('chapterEditor.title')">
                  <b-input v-model="chapter.title"></b-input>
                </b-field>
                <b-field grouped>
                  <b-field :label="$t('chapterEditor.volume')" expanded>
                    <b-input ref="volume" type="number" v-model="chapter.volume"></b-input>
                  </b-field>
                  <b-field :label="$t('chapterEditor.lastUpdated')" expanded>
                    <b-datetimepicker
                      icon-pack="fas"
                      icon="calendar"
                      v-model="datetime"
                      horizontal-time-picker>
                      <template #left>
                        <b-button
                          :label="$t('chapterEditor.now')"
                          type="is-primary"
                          icon-left="clock"
                          @click="datetime = new Date()" />
                      </template>
                    </b-datetimepicker>
                  </b-field>
                </b-field>
                <b-field :label="$t('chapterEditor.groupName')">
                  <b-input v-model="groupName"></b-input>
                </b-field>
                <b-field>
                  <b-checkbox v-model="isProxy">
                    {{ $t('chapterEditor.proxy') }}
                  </b-checkbox>
                </b-field>
                <div v-if="isProxy">
                  <b-field :label="$t('chapterEditor.chapterUrl')">
                    <b-input v-model="pages" @input="onProxyUrlChange"></b-input>
                  </b-field>
                  {{ $t('chapterEditor.proxyHelp') }} <pre style="display: inline; padding: 0.5rem">/proxy/api/</pre> URL
                </div>
                <div v-else>
                  <b-field :label="$t('chapterEditor.imageUrls')">
                    <b-input v-model="pages" type="textarea"></b-input>
                  </b-field>
                  <div class="has-text-right">
                    <b-dropdown aria-role="list">
                      <template #trigger="{ active }">
                        <b-button
                          :label="$t('chapterEditor.import')"
                          type="is-primary"
                          icon-pack="fas"
                          :icon-right="active ? 'caret-up' : 'caret-down'"/>
                      </template>
                      <b-dropdown-item aria-role="listitem" @click="openRedditDialog">{{ $t('chapterEditor.redditGallery') }}</b-dropdown-item>
                      <b-dropdown-item aria-role="listitem" @click="openGDriveDialog">{{ $t('chapterEditor.googleDrive') }}</b-dropdown-item>
                    </b-dropdown>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import { BButton } from "buefy/src/components/button";
import Chapter from "@/model/Chapter";
import Groups from "@/model/Groups";
import Reddit from "@/Reddit";
import GDrive from "@/GDrive";
import Proxy from "@/model/Proxy";

export default {
  name: 'ChapterEditor',
  components: {
    BButton
  },
  data: function () {
    return {
      IMPORT_TYPE_REDDIT: 'reddit',
      IMPORT_TYPE_GDRIVE: 'gdrive',
      isProxy: Groups.isProxy(this.chapter.groups),
      pages: Groups.getPages(this.chapter.groups),
      groupName: Groups.getGroupName(this.chapter.groups),
      datetime: this.chapter.getLastUpdated(),
      isImporting: false,
      importType: null,
      importContent: ''
    }
  },
  methods: {
    discard() {
      this.$emit('discard');
    },
    save() {
      if (!this.$refs.volume.isValid) {
        return;
      }
      this.chapter.setLastUpdated(this.datetime);
      this.chapter.groups = Groups.getGroups(this.groupName, this.pages, this.isProxy);
      this.$emit('save', this.chapterKey, this.chapter);
    },
    openRedditDialog() {
      this.importType = this.IMPORT_TYPE_REDDIT;
      this.importContent = '';
      this.isImporting = true;
    },
    openGDriveDialog() {
      this.importType = this.IMPORT_TYPE_GDRIVE;
      this.importContent = '';
      this.isImporting = true;
    },
    finishImport(close) {
      if (this.importType === this.IMPORT_TYPE_REDDIT) {
        this.parseReddit(this.importContent, close);
      } else if (this.importType === this.IMPORT_TYPE_GDRIVE) {
        this.parseGDrive(this.importContent, close);
      }
    },
    parseGDrive(urls, close) {
      if (GDrive.isGDriveUrl(urls)) {
        close();
        this.isImporting = false;
        this.pages += (this.pages.length === 0 ? '' : '\n') + GDrive.getImgArray(urls).join('\n');
      } else {
        this.$buefy.toast.open({ message: this.$t('chapterEditor.invalidGDrive'), type: 'is-warning' });
      }
    },
    parseReddit(urls, close) {
      if (Reddit.isRedditUrl(urls)) {
        close();
        this.isImporting = false;
        this.$emit('loading', this.$t('chapterEditor.loadingReddit'));
        Reddit.getImgArray(urls).then(value => {
          this.pages += (this.pages.length === 0 ? '' : '\n') + value.join('\n');
          this.$emit('loaded');
        })
          .catch(() => {
            this.$emit('loaded');
            this.$buefy.toast.open({
              message: this.$t('chapterEditor.redditFailed'),
              type: 'is-danger'
            });
          });
      } else {
        this.$buefy.toast.open({ message: this.$t('chapterEditor.invalidReddit'), type: 'is-warning' });
      }
    },
    onProxyUrlChange() {
      const proxy = Proxy.getProxyByUrl(this.pages);
      if (proxy) {
        this.pages = proxy.getProxyUrl(this.pages);
      }
    }

  },
  props: {
    chapter: Chapter,
    chapterKey: String
  }
}
</script>

<style scoped>

</style>
