<template>
  <div>
    <div>
      <div class="column">
        <div class="card">
          <header class="card-header">
            <p class="card-header-title">
              {{ $t('chapterManager.overview') }}
            </p>
            <div class="buttons">
              <b-button type="is-danger" @click="discard">{{ $t('common.discard') }}</b-button>
              <b-button type="is-success" @click="save">{{ $t('common.save') }}</b-button>
            </div>
          </header>
          <div class="card-content">
            <div class="content">
              <section>
                <b-field :label="$t('series.title')">
                  <b-input v-model="series.title"></b-input>
                </b-field>
                <b-field grouped>
                  <b-field :label="$t('chapterManager.artist')" expanded>
                    <b-input v-model="series.artist"></b-input>
                  </b-field>
                  <b-field :label="$t('chapterManager.author')" expanded>
                    <b-input v-model="series.author"></b-input>
                  </b-field>
                </b-field>
                <b-field :label="$t('chapterManager.description')">
                  <b-input v-model="series.description" type="textarea"></b-input>
                </b-field>
                <b-field :label="$t('chapterManager.coverUrl')">
                  <b-input v-model="series.cover"></b-input>
                </b-field>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div>
      <div class="column">
        <div class="card">
          <header class="card-header">
            <p class="card-header-title">
              {{ $t('chapterManager.chapters') }}
            </p>
          </header>
          <div class="card-content">
            <div class="content">
              <div class="has-text-right">
                <b-button type="is-primary"
                          :disabled="checkedRows.length === 0"
                          @click="groupEdit()"
                          icon-pack="fas"
                          class="m-1"
                          icon-left="pen">{{ $t('chapterManager.groupEdit') }}
                </b-button>
                <b-button type="is-primary"
                          @click="addNewChapter()"
                          icon-pack="fas"
                          class="m-1"
                          icon-left="plus">{{ $t('chapterManager.addChapter') }}
                </b-button>
              </div>
              <table>
                <thead>
                <tr>
                  <th>{{ $t('chapterManager.chapterNumber') }}</th>
                  <th>{{ $t('series.title') }}</th>
                  <th>{{ $t('chapterManager.volume') }}</th>
                  <th>{{ $t('chapterManager.lastUpdated') }}</th>
                  <th>{{ $t('series.actions') }}</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="chapter in sortedChapters" :key="chapter.name">
                  <td>{{ chapter }}</td>
                  <td>{{ series.chapters[chapter].title }}</td>
                  <td>{{ series.chapters[chapter].volume }}</td>
                  <td>{{ formatDate(series.chapters[chapter].getLastUpdated()) }}</td>
                  <td>
                    <div class="buttons">
                      <b-button type="is-primary"
                                @click="editChapter(chapter)"
                                icon-pack="fas"
                                icon-right="pen"/>
                      <b-button type="is-danger"
                                @click="confirmDelete(chapter)"
                                icon-pack="fas"
                                icon-right="trash"/>
                    </div>
                  </td>
                </tr>
                </tbody>
              </table>
              <div v-if="sortedChapters.length === 0" class="has-text-centered">{{ $t('chapterManager.noChapters') }}</div>
              <div class="has-text-right">
                <b-button type="is-primary"
                          :disabled="checkedRows.length === 0"
                          @click="groupEdit()"
                          icon-pack="fas"
                          class="m-1"
                          icon-left="pen">{{ $t('chapterManager.groupEdit') }}
                </b-button>
                <b-button type="is-primary"
                          @click="addNewChapter()"
                          icon-pack="fas"
                          class="m-1"
                          icon-left="plus">{{ $t('chapterManager.addChapter') }}
                </b-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import Series from "@/model/Series";
import { BButton } from "buefy/src/components/button";
import Vue from "vue";
import Chapter from "@/model/Chapter";
import Groups from "@/model/Groups";
import GDrive from "@/GDrive";

export default {
  name: 'ChapterManager',
  components: {
    BButton
  },
  data: function () {
    return {
      currentPage: 1,
      checkedRows: []
    }
  },
  computed: {
    sortedChapters() {
      return Object.keys(this.series.chapters).sort(this.compareChapterNames);
    }
  },
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleDateString(this.$locale);
    },
    groupEdit() {
      const target = this;
      this.$buefy.dialog.prompt({
        message: this.$t('chapterManager.setVolumePrompt'),
        trapFocus: true,
        onConfirm: (value) => {
          target.checkedRows.forEach(e => {
            target.series.chapters[e].volume = value;
          });
          target.$buefy.toast.open(this.$t('chapterManager.volumeSet'));
        }
      })
    },
    deleteChapter(number) {
      Vue.delete(this.series.chapters, number);
      this.$buefy.toast.open(this.$t('chapterManager.chapterDeleted'))
    },
    confirmDelete(number) {
      this.$buefy.dialog.confirm({
        title: this.$t('chapterManager.confirmDeleteTitle', { number }),
        message: this.$t('chapterManager.confirmDeleteMessage'),
        confirmText: this.$t('common.delete'),
        type: 'is-danger',
        hasIcon: true,
        onConfirm: () => this.deleteChapter(number)
      })
    },
    editChapter(number) {
      let lastVolume = '';
      let lastGroup = '';
      const keys = Object.keys(this.series.chapters);
      if (keys.length > 0) {
        const lastChapter = this.series.chapters[keys[keys.length - 1]];
        lastVolume = lastChapter.volume;
        lastGroup = Groups.getGroupName(lastChapter.groups);
      }
      this.$emit('chapter', number, this.series.chapters[number] ?? new Chapter(number, lastVolume, null, Groups.getImagesGroup(lastGroup, '')));
    },
    addNewChapter() {
      let key = '';
      const keys = this.sortedChapters;
      if (keys.length > 0) {
        const lastKey = keys[0];
        if (!isNaN(+lastKey)) {
          key = +lastKey + 1;
        }
      }
      this.$buefy.dialog.prompt({
        message: this.$t('chapterManager.promptChapterNumber'),
        inputAttrs: {
          placeholder: this.$t('chapterManager.chapterPlaceholder'),
          value: key + '',
          type: 'number',
          step: 'any'
        },
        trapFocus: true,
        onConfirm: (value) => this.editChapter(value)
      })
    },
    discard() {
      this.$emit('discard');
    },
    save() {
      this.$emit('save', this.name, this.series);
    },
    fixOldGDriveUrls() {
      const target = this;
      this.$buefy.dialog.confirm({
        title: this.$t('chapterManager.fixGDriveTitle'),
        message: this.$t('chapterManager.fixGDriveMessage'),
        confirmText: this.$t('chapterManager.fix'),
        type: 'is-danger',
        hasIcon: true,
        onConfirm: () => {
          let counter = 0;
          const keys = Object.keys(target.series.chapters);
          keys.forEach(e => {
            const chapter = target.series.chapters[e];
            const groups = Object.keys(chapter.groups);
            for (let i = 0; i < groups.length; i++) {
              const group = chapter.groups[groups[i]];
              for (let j = 0; j < group.length; j++) {
                if (GDrive.isOldGDriveUrl(group[j])) {
                  group[j] = GDrive.updateOldUrl(group[j]);
                  counter++;
                }
              }
            }
          });
          target.$buefy.toast.open(this.$t('chapterManager.fixedCount', { count: counter }));
        }
      })
    },
    compareChapterNames(a, b, isAsc = false) {
      if (a === b || isNaN(+a) || isNaN(+b)) {
        return 0;
      }
      if (isAsc) {
        return (+a) - (+b);
      }
      return (+b) - (+a);
    }
  },
  props: {
    series: Series,
    name: String
  }
}
</script>

<style scoped>

</style>
